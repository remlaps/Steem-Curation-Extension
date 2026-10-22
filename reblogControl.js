/*
 * Reblog-with-comment control (runs in the isolated world).
 *
 * Adds a small "reblog" icon to every post container (feed/blog summaries and
 * the full post view). Clicking it opens a dialog where the extension user can
 * add their own comment. Submitting broadcasts a brand-new root post that:
 *   - contains the user's own comment,
 *   - quotes an excerpt from the beginning of the original post,
 *   - links back to the original post, and
 *   - assigns a 50% beneficiary to the original ("parent") author.
 *
 * Signing is delegated to the Steem Keychain browser extension through the
 * main-world bridge defined in reblogBridge.js. This extension itself never
 * requests, stores, or uses any keys.
 */

const SCE_REBLOG_REQUEST = 'SCE_REBLOG_REQUEST';
const SCE_REBLOG_RESPONSE = 'SCE_REBLOG_RESPONSE';
const SCE_REBLOG_BENEFICIARY_WEIGHT = 5000;   // 5000 / 10000 = 50%
const SCE_REBLOG_EXCERPT_LENGTH = 320;        // max characters of the original post excerpt
const SCE_REBLOG_MARKER_TAG = 'sce-reblog'; // added to every reblog so reblogs can be aggregated (one dash so it stays editable in Condenser)
const SCE_REBLOG_MAX_TAGS = 5;                // maximum number of tags on the new post
const SCE_REBLOG_MAX_TAG_LENGTH = 24;         // Condenser's maximum tag length
const SCE_REBLOG_APP_NAME = 'steem-curation-extension';
const SCE_REBLOG_KEYCHAIN_URL = 'https://chromewebstore.google.com/detail/steem-keychain/lkcjlnjfpbikmcmbachjpdbijejflpcm';
const SCE_REBLOG_ICON_SVG =
    '<svg class="sce-reblog-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="17 1 21 5 17 9"></polyline>' +
    '<path d="M3 11V9a4 4 0 0 1 4-4h14"></path>' +
    '<polyline points="7 23 3 19 7 15"></polyline>' +
    '<path d="M21 13v2a4 4 0 0 1-4 4H3"></path>' +
    '</svg>';

let sceReblogRequestCounter = 0;
const sceReblogPendingRequests = new Map();
const sceReblogAuthorCache = new Map();
let sceReblogToastElement = null;
let sceReblogToastTimer = null;

/* ------------------------------------------------------------------------- */
/* Main-world bridge plumbing                                                */
/* ------------------------------------------------------------------------- */

window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.type !== SCE_REBLOG_RESPONSE || !data.nonce) return;

    const resolve = sceReblogPendingRequests.get(data.nonce);
    if (resolve) {
        sceReblogPendingRequests.delete(data.nonce);
        resolve(data);
    }
});

/**
 * Sends a request to the main-world bridge and resolves with its response.
 * @param {object} payload - The bridge payload (must include an `action`).
 * @param {number} timeoutMs - How long to wait before giving up.
 * @returns {Promise<object>} The bridge response, or `{ error: 'timeout' }`.
 */
function sceReblogBridgeRequest(payload, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const nonce = `${Date.now()}-${++sceReblogRequestCounter}`;
        sceReblogPendingRequests.set(nonce, resolve);
        window.postMessage(Object.assign({ type: SCE_REBLOG_REQUEST, nonce }, payload), '*');

        setTimeout(() => {
            if (sceReblogPendingRequests.has(nonce)) {
                sceReblogPendingRequests.delete(nonce);
                resolve({ error: 'timeout' });
            }
        }, timeoutMs);
    });
}

async function isSteemKeychainAvailable() {
    const response = await sceReblogBridgeRequest({ action: 'ping' }, 1500);
    return !!(response && response.available);
}

/* ------------------------------------------------------------------------- */
/* Small UI helpers                                                          */
/* ------------------------------------------------------------------------- */

/**
 * Shows a transient status message (optionally with a link) near the bottom
 * of the viewport.
 */
function sceReblogNotify(message, isError = false, link = null) {
    withSilentMutations(() => {
        if (!sceReblogToastElement) {
            sceReblogToastElement = document.createElement('div');
            sceReblogToastElement.className = 'sce-reblog-toast';
            document.body.appendChild(sceReblogToastElement);
        }

        sceReblogToastElement.textContent = '';
        sceReblogToastElement.classList.toggle('sce-reblog-toast-error', !!isError);

        const text = document.createElement('span');
        text.textContent = message;
        sceReblogToastElement.appendChild(text);

        if (link && link.href) {
            const anchor = document.createElement('a');
            anchor.href = link.href;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.textContent = link.text || link.href;
            sceReblogToastElement.appendChild(document.createTextNode(' '));
            sceReblogToastElement.appendChild(anchor);
        }

        sceReblogToastElement.classList.add('visible');
        clearTimeout(sceReblogToastTimer);
        sceReblogToastTimer = setTimeout(() => {
            sceReblogToastElement.classList.remove('visible');
        }, 8000);
    })();
}

/* ------------------------------------------------------------------------- */
/* Post detection                                                            */
/* ------------------------------------------------------------------------- */

/**
 * Extracts { author, permlink } from any Steem/Condenser post URL.
 * More tolerant than the shared `extractAuthorAndPermlink` helper (handles
 * trailing slashes, query strings and category prefixes).
 */
function sceReblogParsePostHref(href) {
    if (!href) return null;
    try {
        const url = new URL(href, window.location.origin);
        const match = url.pathname.match(/\/@([^\/]+)\/([^\/]+)/);
        if (match) {
            return { author: match[1], permlink: match[2] };
        }
    } catch (error) {
        console.debug('SCE: Unable to parse post URL for reblog:', href, error);
    }
    return null;
}

function sceReblogFindSummaryLink(postItem) {
    if (!postItem) return null;
    return postItem.querySelector(
        '.articles__content h2 > a, .articles__content .PostSummary__body.entry-content > a'
    );
}

/* ------------------------------------------------------------------------- */
/* New-post content construction                                             */
/* ------------------------------------------------------------------------- */

/**
 * Reduces Markdown to plain text so the excerpt renders predictably inside a
 * blockquote and cannot inject markup into the new post.
 */
function sceReblogStripMarkdown(text) {
    if (!text) return '';
    let output = String(text);
    output = output.replace(/```[\s\S]*?```/g, ' ');          // fenced code blocks
    output = output.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');    // images
    output = output.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');  // links -> text
    output = output.replace(/`([^`]+)`/g, '$1');              // inline code
    output = output.replace(/^\s{0,3}#{1,6}\s+/gm, '');       // headings
    output = output.replace(/^\s{0,3}>\s?/gm, '');            // nested quotes
    output = output.replace(/<[^>]+>/g, ' ');                 // html tags
    output = output.replace(/[*_~]{1,3}/g, '');               // emphasis markers
    output = output.replace(/\s+/g, ' ').trim();              // collapse whitespace
    return output;
}

/**
 * Builds a plain-text excerpt from the beginning of the original post.
 */
function sceReblogBuildExcerpt(body, maxLength = SCE_REBLOG_EXCERPT_LENGTH) {
    const plain = sceReblogStripMarkdown(body);
    if (plain.length <= maxLength) return plain;

    let cut = plain.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.6) {
        cut = cut.slice(0, lastSpace);
    }
    return `${cut.trim()}…`;
}

/**
 * Assembles the Markdown body of the new post: the user's comment, a quoted
 * excerpt of the original post, and a link back to it.
 */
function sceReblogBuildBody(comment, excerpt, author, permlink, title, labels, reblogger, thumbnail) {
    const relativeUrl = `/@${author}/${permlink}`;
    const linkText = title || `${author}/${permlink}`;
    const lines = [];

    // The image is included in the body (not only json_metadata) because some
    // Condenser front ends (e.g. steemit.com) derive the feed thumbnail from the
    // body's first image rather than from json_metadata.image. It is wrapped in
    // a right-floated <div> (Condenser whitelists the "pull-right" class) so the
    // surrounding text wraps around it.
    if (thumbnail) {
        const alt = String(title || '').replace(/"/g, '').trim();
        lines.push('<div class="pull-right">');
        lines.push('');
        lines.push(`<img src="${thumbnail}" alt="${alt}" />`);
        lines.push('');
        lines.push('</div>');
        lines.push('');
    }

    if (comment && comment.trim()) {
        lines.push(comment.trim());
        lines.push('');
    }

    lines.push(`> ${excerpt.replace(/\n/g, '\n> ')}`);
    lines.push('');
    // The original author is mentioned as plain text (outside the link) so that
    // Condenser renders it as a real @-mention and notifies them. The mention is
    // skipped for self-reblogs (reblogging your own post). The link text is the
    // original post's title and the URL is relative, so it resolves on whichever
    // Condenser front end the reblog is viewed on.
    const mention = (reblogger && reblogger === author) ? '' : `@${author}`;
    if (mention) {
        lines.push(`${labels.linkLabelBy} ${mention}: [${linkText}](${relativeUrl})`);
    } else {
        lines.push(`${labels.linkLabel} [${linkText}](${relativeUrl})`);
    }

    const trailingNotes = [];
    if (labels.attributionNote) {
        trailingNotes.push(labels.attributionNote);
    }
    if (!(reblogger && reblogger === author) && labels.beneficiaryNote) {
        trailingNotes.push(labels.beneficiaryNote.replace('{author}', author));
    }
    if (trailingNotes.length) {
        lines.push('');
        lines.push(`_${trailingNotes.join(' ')}_`);
    }

    return lines.join('\n');
}

function sceReblogParseMetadata(jsonMetadata) {
    if (!jsonMetadata) return {};
    if (typeof jsonMetadata === 'object') return jsonMetadata;
    try {
        return JSON.parse(jsonMetadata);
    } catch (error) {
        console.debug('SCE: Unable to parse json_metadata for reblog:', error);
        return {};
    }
}

/**
 * Collects candidate thumbnail image URLs from the original post: first from
 * its json_metadata `image` array, then from inline Markdown images in the
 * body. Only http(s) URLs are returned.
 */
function sceReblogExtractImages(content, maxImages = 2) {
    const images = [];
    const add = (url) => {
        if (typeof url !== 'string') return;
        const trimmed = url.trim();
        if (/^https?:\/\//i.test(trimmed) && !images.includes(trimmed)) {
            images.push(trimmed);
        }
    };

    const metadata = sceReblogParseMetadata(content.json_metadata);
    if (Array.isArray(metadata.image)) {
        metadata.image.forEach(add);
    }

    if (images.length < maxImages && typeof content.body === 'string') {
        const imageRegex = /!\[[^\]]*\]\(\s*([^)\s]+)/g;
        let match;
        while ((match = imageRegex.exec(content.body)) && images.length < maxImages) {
            add(match[1]);
        }
    }

    return images.slice(0, maxImages);
}

/**
 * Generates a unique, valid Steem permlink for the new post.
 */
function sceReblogGeneratePermlink(author) {
    const stamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `reblog-${author}-${stamp}-${random}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 250);
}

/**
 * Returns true when a permlink looks like a post generated by this extension's
 * reblog feature (see sceReblogGeneratePermlink).
 */
function sceReblogIsReblogPermlink(permlink) {
    return typeof permlink === 'string' && permlink.startsWith('reblog-');
}

/**
 * Resolves the original ("reblogged") author of a reblog post. Confirms that
 * the post was generated by this extension and returns its 50% beneficiary
 * (the original author), or null when it cannot be determined.
 *
 * Results are memoized because a post's beneficiaries never change.
 */
async function sceReblogGetRebloggedAuthor(author, permlink) {
    const cacheKey = `${author}/${permlink}`;
    if (sceReblogAuthorCache.has(cacheKey)) {
        return sceReblogAuthorCache.get(cacheKey);
    }

    let rebloggedAuthor = null;
    try {
        const content = await getContent(author, permlink);
        if (content) {
            const metadata = sceReblogParseMetadata(content.json_metadata);
            const app = typeof metadata.app === 'string' ? metadata.app : '';
            const isSceReblog = app.startsWith(`${SCE_REBLOG_APP_NAME}/`)
                || (Array.isArray(metadata.tags) && metadata.tags.includes(SCE_REBLOG_MARKER_TAG));

            if (isSceReblog && Array.isArray(content.beneficiaries) && content.beneficiaries.length) {
                rebloggedAuthor = content.beneficiaries[0].account || null;
            }
        }
    } catch (error) {
        console.warn('SCE: Failed to resolve the reblogged author:', error);
    }

    sceReblogAuthorCache.set(cacheKey, rebloggedAuthor);
    return rebloggedAuthor;
}

/* ------------------------------------------------------------------------- */
/* Tags                                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Normalizes a single tag to Condenser's rules (lowercase, [a-z0-9-], max 24
 * characters).
 */
function sceReblogNormalizeTag(tag) {
    return String(tag == null ? '' : tag)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, SCE_REBLOG_MAX_TAG_LENGTH);
}

/**
 * Normalizes a list of tags, removing empties and duplicates.
 */
function sceReblogNormalizeTags(list) {
    const result = [];
    (Array.isArray(list) ? list : []).forEach((tag) => {
        const normalized = sceReblogNormalizeTag(tag);
        if (normalized && !result.includes(normalized)) result.push(normalized);
    });
    return result;
}

/**
 * The default tag list for a reblog: the original post's category followed by
 * its other tags (falling back to "steem" when the original has none).
 */
function sceReblogDefaultTagList(content) {
    const metadata = sceReblogParseMetadata(content.json_metadata);
    const list = [];
    if (content.category) list.push(content.category);
    (Array.isArray(metadata.tags) ? metadata.tags : []).forEach((tag) => {
        if (tag) list.push(tag);
    });
    if (!list.length) list.push('steem');
    return list;
}

/**
 * Finalizes a tag list: normalizes it, caps it at SCE_REBLOG_MAX_TAGS and
 * guarantees the SCE_REBLOG_MARKER_TAG is present (replacing the last tag when
 * the list is already full).
 */
function sceReblogFinalizeTags(rawList) {
    const tags = sceReblogNormalizeTags(rawList);
    if (!tags.length) tags.push('steem');

    if (tags.includes(SCE_REBLOG_MARKER_TAG)) {
        return tags.slice(0, SCE_REBLOG_MAX_TAGS);
    }
    if (tags.length >= SCE_REBLOG_MAX_TAGS) {
        tags.length = SCE_REBLOG_MAX_TAGS - 1;
    }
    tags.push(SCE_REBLOG_MARKER_TAG);
    return tags.slice(0, SCE_REBLOG_MAX_TAGS);
}

/**
 * Computes the default (editable) tags offered for a reblog.
 */
function sceReblogComputeTags(content) {
    return sceReblogFinalizeTags(sceReblogDefaultTagList(content));
}

/**
 * Builds the `comment` + `comment_options` operation pair. The beneficiary
 * (50% to the original author) is attached to the `comment_options` op and
 * applies to the new post.
 */
function sceReblogBuildOperations({ username, info, content, title, body, tags, images }) {
    const tagInput = (Array.isArray(tags) && tags.length) ? tags : sceReblogDefaultTagList(content);
    const finalTags = sceReblogFinalizeTags(tagInput);
    const parentPermlink = finalTags[0];
    const permlink = sceReblogGeneratePermlink(info.author);

    let version = '0.0.0';
    try {
        version = chrome.runtime.getManifest().version;
    } catch (error) {
        console.debug('SCE: Unable to read extension version:', error);
    }

    const finalImages = Array.isArray(images) ? images : sceReblogExtractImages(content);
    const jsonMetadata = {
        tags: finalTags,
        app: `${SCE_REBLOG_APP_NAME}/${version}`
    };
    if (finalImages.length) {
        jsonMetadata.image = finalImages;
    }

    const operations = [
        ['comment', {
            parent_author: '',
            parent_permlink: parentPermlink,
            author: username,
            permlink: permlink,
            title: title,
            body: body,
            json_metadata: JSON.stringify(jsonMetadata)
        }]
    ];

    // Beneficiaries only make sense when reblogging someone else's post.
    const extensions = [];
    if (info.author && info.author !== username) {
        extensions.push([0, {
            beneficiaries: [{ account: info.author, weight: SCE_REBLOG_BENEFICIARY_WEIGHT }]
        }]);
    }

    operations.push(['comment_options', {
        author: username,
        permlink: permlink,
        max_accepted_payout: '1000000.000 SBD',
        percent_steem_dollars: 10000,
        allow_votes: true,
        allow_curation_rewards: true,
        extensions: extensions
    }]);

    return operations;
}

/* ------------------------------------------------------------------------- */
/* Dialog                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Builds the reblog dialog DOM and returns references to its interactive parts.
 */
function sceReblogBuildModal(labels) {
    const backdrop = document.createElement('div');
    backdrop.className = 'sce-reblog-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'sce-reblog-modal';

    const header = document.createElement('div');
    header.className = 'sce-reblog-modal-header';
    const title = document.createElement('span');
    title.className = 'sce-reblog-modal-title';
    title.textContent = labels.dialogTitle;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'sce-reblog-modal-close';
    close.setAttribute('aria-label', labels.cancel);
    close.textContent = '\u00D7';
    header.appendChild(title);
    header.appendChild(close);

    const body = document.createElement('div');
    body.className = 'sce-reblog-modal-body';

    const titleLabel = document.createElement('label');
    titleLabel.className = 'sce-reblog-label';
    titleLabel.textContent = labels.titleLabel;
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'sce-reblog-title-input';

    const commentLabel = document.createElement('label');
    commentLabel.className = 'sce-reblog-label';
    commentLabel.textContent = labels.commentLabel;
    const commentInput = document.createElement('textarea');
    commentInput.className = 'sce-reblog-comment-input';
    commentInput.rows = 5;
    commentInput.placeholder = labels.commentPlaceholder;

    const tagsLabel = document.createElement('label');
    tagsLabel.className = 'sce-reblog-label';
    tagsLabel.textContent = labels.tagsLabel;
    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.className = 'sce-reblog-tags-input';
    tagsInput.placeholder = labels.tagsPlaceholder;

    const previewLabel = document.createElement('label');
    previewLabel.className = 'sce-reblog-label';
    previewLabel.textContent = labels.excerptLabel;
    const preview = document.createElement('div');
    preview.className = 'sce-reblog-preview';

    const postPreviewLabel = document.createElement('label');
    postPreviewLabel.className = 'sce-reblog-label';
    postPreviewLabel.textContent = labels.postPreviewLabel;
    const postPreview = document.createElement('div');
    postPreview.className = 'sce-reblog-post-preview';

    const beneficiary = document.createElement('div');
    beneficiary.className = 'sce-reblog-beneficiary';

    const status = document.createElement('div');
    status.className = 'sce-reblog-status';

    body.appendChild(titleLabel);
    body.appendChild(titleInput);
    body.appendChild(commentLabel);
    body.appendChild(commentInput);
    body.appendChild(tagsLabel);
    body.appendChild(tagsInput);
    body.appendChild(previewLabel);
    body.appendChild(preview);
    body.appendChild(postPreviewLabel);
    body.appendChild(postPreview);
    body.appendChild(beneficiary);
    body.appendChild(status);

    const footer = document.createElement('div');
    footer.className = 'sce-reblog-modal-footer';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'sce-reblog-cancel';
    cancel.textContent = labels.cancel;
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'sce-reblog-submit';
    submit.textContent = labels.submit;
    footer.appendChild(cancel);
    footer.appendChild(submit);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);

    return { backdrop, close, cancel, submit, titleInput, commentInput, tagsInput, preview, postPreview, beneficiary, status };
}

/**
 * Trims punctuation that is unlikely to be part of a bare URL (trailing
 * sentence punctuation, plus an unbalanced closing bracket).
 */
function sceReblogTrimUrl(rawUrl) {
    let url = rawUrl;
    while (/[.,;:!?]$/.test(url)) {
        url = url.slice(0, -1);
    }
    if (/[)\]]$/.test(url)) {
        const open = (url.match(/[(\[]/g) || []).length;
        const close = (url.match(/[)\]]/g) || []).length;
        if (close > open) {
            url = url.slice(0, -1);
        }
    }
    return url;
}

/**
 * Appends plain text to `parent`, turning bare http(s) URLs into anchors and
 * everything else into text nodes (never HTML).
 */
function sceReblogAppendLinkifiedText(parent, text) {
    const source = String(text == null ? '' : text);
    const urlRegex = /(https?:\/\/[^\s<>]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(source)) !== null) {
        if (match.index > lastIndex) {
            parent.appendChild(document.createTextNode(source.slice(lastIndex, match.index)));
        }

        const url = sceReblogTrimUrl(match[1]);
        const trailing = match[1].slice(url.length);

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.textContent = url;
        anchor.rel = 'noopener noreferrer';
        anchor.target = '_blank';
        parent.appendChild(anchor);

        if (trailing) {
            parent.appendChild(document.createTextNode(trailing));
        }

        lastIndex = urlRegex.lastIndex;
    }

    if (lastIndex < source.length) {
        parent.appendChild(document.createTextNode(source.slice(lastIndex)));
    }
}

/**
 * Appends `text` to `parent`, rendering `[text](url)` occurrences and bare
 * http(s) URLs as anchors, and all other content as plain text. Untrusted text
 * is never parsed as HTML, so it cannot inject markup into the preview.
 */
function sceReblogRenderInlineMarkdown(parent, text) {
    const source = String(text == null ? '' : text);
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(source)) !== null) {
        if (match.index > lastIndex) {
            sceReblogAppendLinkifiedText(parent, source.slice(lastIndex, match.index));
        }

        const href = match[2];
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.textContent = match[1];
        anchor.rel = 'noopener noreferrer';
        if (/^https?:\/\//i.test(href)) {
            anchor.target = '_blank';
        }
        parent.appendChild(anchor);

        lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < source.length) {
        sceReblogAppendLinkifiedText(parent, source.slice(lastIndex));
    }
}

/**
 * Renders the reblog post preview as DOM nodes (lightweight, no Markdown
 * dependency). Only the structures this extension generates are rendered as
 * rich elements; user and third-party text is always inserted with
 * textContent.
 */
function sceReblogRenderPreview(container, { comment, excerpt, author, permlink, title, labels, reblogger, thumbnail }) {
    container.textContent = '';

    const relativeUrl = `/@${author}/${permlink}`;
    const linkText = title || `${author}/${permlink}`;
    const mention = (reblogger && reblogger === author) ? '' : `@${author}`;

    if (thumbnail) {
        const img = document.createElement('img');
        img.className = 'sce-reblog-preview-thumbnail';
        img.src = thumbnail;
        img.alt = title || '';
        container.appendChild(img);
    }

    if (comment && comment.trim()) {
        const commentEl = document.createElement('p');
        commentEl.className = 'sce-reblog-preview-comment';
        sceReblogRenderInlineMarkdown(commentEl, comment.trim());
        container.appendChild(commentEl);
    }

    const excerptEl = document.createElement('blockquote');
    excerptEl.className = 'sce-reblog-preview-excerpt';
    excerptEl.textContent = excerpt;
    container.appendChild(excerptEl);

    const linkEl = document.createElement('p');
    linkEl.className = 'sce-reblog-preview-link';
    linkEl.appendChild(document.createTextNode(
        mention ? `${labels.linkLabelBy} ${mention}: ` : `${labels.linkLabel} `
    ));
    const anchor = document.createElement('a');
    anchor.href = relativeUrl;
    anchor.textContent = linkText;
    linkEl.appendChild(anchor);
    container.appendChild(linkEl);

    const trailingNotes = [];
    if (labels.attributionNote) {
        trailingNotes.push(labels.attributionNote);
    }
    if (!(reblogger && reblogger === author) && labels.beneficiaryNote) {
        trailingNotes.push(labels.beneficiaryNote.replace('{author}', author));
    }
    if (trailingNotes.length) {
        const attributionEl = document.createElement('p');
        attributionEl.className = 'sce-reblog-preview-attribution';
        const em = document.createElement('em');
        sceReblogRenderInlineMarkdown(em, trailingNotes.join(' '));
        attributionEl.appendChild(em);
        container.appendChild(attributionEl);
    }
}

/**
 * Opens the reblog dialog for a post. Handles login/Keychain checks, fetches
 * the original post, and wires up the broadcast on submit.
 */
async function openReblogDialog(info) {
    const labels = getReblogLabelsInLang(detectUserLanguage() || 'en');
    const username = (typeof getUsername === 'function') ? getUsername() : null;

    if (!username) {
        sceReblogNotify(labels.loginRequired, true);
        return;
    }

    if (!(await isSteemKeychainAvailable())) {
        sceReblogNotify(labels.keychainMissing, true, {
            href: SCE_REBLOG_KEYCHAIN_URL,
            text: labels.keychainLinkText
        });
        return;
    }

    let content;
    try {
        content = await getContent(info.author, info.permlink);
    } catch (error) {
        console.warn('SCE: Failed to fetch post for reblog:', error);
    }
    if (!content) {
        sceReblogNotify(labels.loadFailed, true);
        return;
    }

    const excerpt = sceReblogBuildExcerpt(content.body);
    const images = sceReblogExtractImages(content);
    const thumbnail = images[0] || null;
    const defaultTitle = `${labels.titlePrefix} ${content.title || `${info.author}/${info.permlink}`}`;

    const ui = sceReblogBuildModal(labels);
    ui.titleInput.value = defaultTitle;
    ui.tagsInput.value = sceReblogComputeTags(content).join(', ');
    ui.preview.textContent = excerpt;

    // Live preview of the full post that will be broadcast (rendered as DOM).
    const updatePostPreview = () => {
        sceReblogRenderPreview(ui.postPreview, {
            comment: ui.commentInput.value,
            excerpt: excerpt,
            author: info.author,
            permlink: info.permlink,
            title: content.title,
            labels: labels,
            reblogger: username,
            thumbnail: thumbnail
        });
    };
    updatePostPreview();
    ui.commentInput.addEventListener('input', updatePostPreview);

    if (info.author && info.author !== username) {
        ui.beneficiary.textContent = labels.beneficiaryNote.replace('{author}', info.author);
    }

    const closeModal = withSilentMutations(() => {
        if (ui.backdrop.parentNode) {
            ui.backdrop.parentNode.removeChild(ui.backdrop);
        }
        document.removeEventListener('keydown', onKeydown);
    });

    function onKeydown(event) {
        if (event.key === 'Escape') closeModal();
    }

    ui.close.addEventListener('click', closeModal);
    ui.cancel.addEventListener('click', closeModal);
    ui.backdrop.addEventListener('click', (event) => {
        if (event.target === ui.backdrop) closeModal();
    });
    document.addEventListener('keydown', onKeydown);

    ui.submit.addEventListener('click', async () => {
        if (ui.submit.disabled) return;

        const title = ui.titleInput.value.trim() || defaultTitle;
        const body = sceReblogBuildBody(ui.commentInput.value, excerpt, info.author, info.permlink, content.title, labels, username, thumbnail);
        const tags = ui.tagsInput.value.split(/[\s,]+/).filter(Boolean);
        const operations = sceReblogBuildOperations({ username, info, content, title, body, tags, images });

        console.debug('SCE: Broadcasting reblog operations:', operations);

        ui.submit.disabled = true;
        ui.cancel.disabled = true;
        ui.status.classList.remove('sce-reblog-status-error');
        ui.status.textContent = labels.working;

        const response = await sceReblogBridgeRequest({
            action: 'broadcast',
            username: username,
            operations: operations,
            keyType: 'Posting'
        }, 180000);

        if (response && response.error) {
            ui.submit.disabled = false;
            ui.cancel.disabled = false;
            ui.status.classList.add('sce-reblog-status-error');
            ui.status.textContent = `${labels.broadcastFailed} ${response.error}`;
            return;
        }

        const result = response && response.response;
        if (result && result.success) {
            closeModal();
            sceReblogNotify(labels.success, false);
            return;
        }

        ui.submit.disabled = false;
        ui.cancel.disabled = false;
        ui.status.classList.add('sce-reblog-status-error');
        const message = (result && (result.message || result.error)) || 'Unknown error';
        ui.status.textContent = `${labels.broadcastFailed} ${message}`;
    });

    withSilentMutations(() => document.body.appendChild(ui.backdrop))();
    ui.commentInput.focus();
}

/* ------------------------------------------------------------------------- */
/* Icon injection                                                            */
/* ------------------------------------------------------------------------- */

function sceReblogCreateButton(info, labels) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sce-reblog-button';
    button.title = labels.buttonTitle;
    button.setAttribute('aria-label', labels.buttonTitle);
    button.innerHTML = SCE_REBLOG_ICON_SVG;
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openReblogDialog(info);
    });
    return button;
}

/**
 * Adds a reblog icon to every post container:
 *   1. Feed/blog summaries (`div.articles__summary-header`).
 *   2. The full post view (next to the native Reblog button).
 *
 * Idempotent and safe to call repeatedly from the mutation observer.
 */
function addReblogButtons() {
    const labels = getReblogLabelsInLang(detectUserLanguage() || 'en');

    // 1) Feed / blog summaries.
    document.querySelectorAll('div.articles__summary-header').forEach((header) => {
        if (header.querySelector('.sce-reblog-button')) return;

        const postItem = header.closest('li');
        const postLink = sceReblogFindSummaryLink(postItem);
        if (!postLink || !postLink.href) return;

        const info = sceReblogParsePostHref(postLink.href);
        if (!info) return;

        const button = sceReblogCreateButton(info, labels);
        const overlayContainer = header.querySelector('.overlay-container');
        if (overlayContainer) {
            overlayContainer.appendChild(button);
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'sce-reblog-container';
            wrapper.appendChild(button);
            header.appendChild(wrapper);
        }
    });

    // 2) Full post view.
    const reblogAnchor = document.querySelector('.Reblog__button');
    const shareContainer = reblogAnchor ? reblogAnchor.parentNode : document.querySelector('.RightShare__Menu');
    if (shareContainer && !shareContainer.querySelector('.sce-reblog-button')) {
        const info = sceReblogParsePostHref(window.location.href);
        if (info) {
            const button = sceReblogCreateButton(info, labels);
            if (reblogAnchor && reblogAnchor.parentNode === shareContainer) {
                shareContainer.insertBefore(button, reblogAnchor.nextSibling);
            } else {
                shareContainer.appendChild(button);
            }
        }
    }
}
// Injecting buttons modifies the page; wrap to avoid re-triggering the observer.
addReblogButtons = withSilentMutations(addReblogButtons);
