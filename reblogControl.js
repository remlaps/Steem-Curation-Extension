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
const SCE_REBLOG_BENEFICIARY_PERCENTAGES = [25, 50, 75, 100]; // author-beneficiary choices (percent)
const SCE_REBLOG_DEFAULT_BENEFICIARY_PERCENT = 50;            // default author-beneficiary percentage
const SCE_REBLOG_EXCERPT_LENGTH = 320;        // max characters of the original post excerpt
const SCE_REBLOG_MARKER_TAG = 'sce-reblog'; // added to every reblog so reblogs can be aggregated (one dash so it stays editable in Condenser)
const SCE_REBLOG_MAX_TAGS = 5;                // maximum number of tags on the new post
const SCE_REBLOG_MAX_TAG_LENGTH = 24;         // Condenser's maximum tag length
const SCE_REBLOG_MAX_TITLE_LENGTH = 256;      // mirrors reblogBridge.js MAX_TITLE_LENGTH
const SCE_REBLOG_MAX_BODY_LENGTH = 65536;     // mirrors reblogBridge.js MAX_BODY_LENGTH
const SCE_REBLOG_MAX_COMMENT_LENGTH = SCE_REBLOG_MAX_BODY_LENGTH - 2000; // headroom for excerpt/link/notes
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

// Only plain http(s) image URLs may be embedded in a reblog: no quotes, angle
// brackets, whitespace or backslashes that could break out of an HTML attribute.
const SCE_REBLOG_SAFE_IMAGE_URL_REGEX = /^https?:\/\/[^\s"'<>\\]+$/i;
const SCE_REBLOG_MAX_IMAGE_URL_LENGTH = 2048;
const SCE_REBLOG_MIN_MODAL_WIDTH = 360;      // minimum resizable dialog width (px)
const SCE_REBLOG_MIN_MODAL_HEIGHT = 240;     // minimum resizable dialog height (px)
const SCE_REBLOG_SIDE_BY_SIDE_WIDTH = 1040;  // width the dialog widens to for the side-by-side layout (px)

let sceReblogRequestCounter = 0;
const sceReblogPendingRequests = new Map();
const sceReblogAuthorCache = new Map();
let sceReblogToastElement = null;
let sceReblogToastTimer = null;

/* ------------------------------------------------------------------------- */
/* Markdown engine (Remarkable, vendored in libs/remarkable.min.js)          */
/* ------------------------------------------------------------------------- */

// Remarkable is the Markdown engine Condenser's own editor uses. It is declared
// before this script in manifest.json and exposes `window.remarkable`
// (`Remarkable` plus the `linkify` plugin) in the isolated world. Options:
//   html: true   - raw HTML in the source is parsed (so inline markup such as
//                  <div class="pull-right"> renders, as it does on Condenser).
//                  This is safe because every rendered string is passed through
//                  sceReblogSanitizeHtml below, which unwraps disallowed tags
//                  and strips every attribute it does not explicitly allow.
//   breaks: true - single newlines become <br> (matches Condenser).
// The linkify plugin (bundled in the same UMD build) turns bare http(s) URLs
// into anchors, matching the previous hand-rolled preview behavior.
const sceReblogRemarkable = (typeof window !== 'undefined' && window.remarkable)
    ? window.remarkable
    : null;
const sceReblogMarkdown = (sceReblogRemarkable && sceReblogRemarkable.Remarkable)
    ? new sceReblogRemarkable.Remarkable({ html: true, breaks: true })
    : null;
if (sceReblogMarkdown && typeof sceReblogRemarkable.linkify === 'function') {
    sceReblogMarkdown.use(sceReblogRemarkable.linkify);
}

// Tags the preview is allowed to keep. Anything else is unwrapped (its text is
// kept) and every attribute is dropped unless explicitly allowed below.
const SCE_REBLOG_ALLOWED_TAGS = new Set([
    'P', 'A', 'STRONG', 'EM', 'DEL', 'S', 'BLOCKQUOTE', 'CODE', 'PRE',
    'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'BR',
    'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
    'DIV', 'SPAN', 'FIGURE', 'FIGCAPTION', 'SUP', 'SUB'
]);

// Class names the preview may keep on allowed elements (the subset Condenser
// itself whitelists for floats and text alignment). Every other class is dropped.
const SCE_REBLOG_ALLOWED_CLASSES = new Set([
    'pull-left', 'pull-right',
    'text-left', 'text-center', 'text-right', 'text-justify'
]);

/* ------------------------------------------------------------------------- */
/* Main-world bridge plumbing                                                */
/* ------------------------------------------------------------------------- */

window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
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
        window.postMessage(Object.assign({ type: SCE_REBLOG_REQUEST, nonce }, payload), window.location.origin);

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
 * Escapes a value so it can be safely embedded inside an HTML attribute.
 */
function sceReblogEscapeHtmlAttribute(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Strips the characters that would let a crafted title break out of the
 * generated `[text](url)` Markdown link.
 */
function sceReblogSanitizeLinkText(text) {
    const cleaned = String(text == null ? '' : text)
        .replace(/[[\]]/g, '')
        .replace(/\r?\n/g, ' ')
        .trim()
        .slice(0, 256);
    return cleaned || '...';
}

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
 * True when `url` is safe to use in the preview: a plain http(s) URL, or (when
 * `allowRelative`) a same-site relative link or fragment. Everything else -
 * notably `javascript:`/`data:` schemes - is rejected.
 */
function sceReblogIsSafeUrl(url, allowRelative) {
    const value = String(url == null ? '' : url).trim();
    if (!value) return false;
    if (SCE_REBLOG_SAFE_IMAGE_URL_REGEX.test(value)) return true;
    if (allowRelative && (value.startsWith('#') || /^\/(?!\/)/.test(value))) return true;
    return false;
}

/**
 * Removes any tag that is not on the allowlist, keeping its text, until only
 * allowed elements remain. Remarkable runs with `html: true`, so raw HTML from
 * the source reaches this step and must be filtered here.
 */
function sceReblogUnwrapDisallowedTags(root) {
    let changed = true;
    while (changed) {
        changed = false;
        Array.from(root.querySelectorAll('*')).forEach((element) => {
            if (SCE_REBLOG_ALLOWED_TAGS.has(element.tagName)) return;
            while (element.firstChild) {
                element.parentNode.insertBefore(element.firstChild, element);
            }
            element.parentNode.removeChild(element);
            changed = true;
        });
    }
}

/**
 * Drops every attribute except a validated `href` on anchors, `src`/`alt` on
 * images, and whitelisted `class` names, then hardens the surviving links.
 */
function sceReblogStripAttributes(root) {
    Array.from(root.querySelectorAll('*')).forEach((element) => {
        const isAnchor = element.tagName === 'A';
        const isImage = element.tagName === 'IMG';

        Array.from(element.attributes).forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            if (name === 'class') {
                const allowed = String(attribute.value || '')
                    .split(/\s+/)
                    .filter((className) => SCE_REBLOG_ALLOWED_CLASSES.has(className));
                if (allowed.length) {
                    element.setAttribute('class', allowed.join(' '));
                } else {
                    element.removeAttribute('class');
                }
                return;
            }
            let keep = false;
            if (isAnchor && name === 'href') {
                keep = sceReblogIsSafeUrl(attribute.value, true);
            } else if (isImage && name === 'src') {
                keep = sceReblogIsSafeUrl(attribute.value, false)
                    && attribute.value.length <= SCE_REBLOG_MAX_IMAGE_URL_LENGTH;
            } else if (isImage && name === 'alt') {
                keep = true;
            }
            if (!keep) element.removeAttribute(attribute.name);
        });

        if (isAnchor && element.hasAttribute('href')) {
            element.setAttribute('rel', 'noopener noreferrer');
            if (!/^\//.test(element.getAttribute('href'))) {
                element.setAttribute('target', '_blank');
            }
        }
    });
}

/**
 * Parses Remarkable's HTML output into a detached container, stripping anything
 * not on the allowlist. A `<template>` is used so nothing runs or loads while
 * the markup is being parsed.
 */
function sceReblogSanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html == null ? '' : html);
    const container = document.createElement('div');
    container.appendChild(template.content.cloneNode(true));
    sceReblogUnwrapDisallowedTags(container);
    sceReblogStripAttributes(container);
    return container;
}

// Block-level tags treated as word separators when rendered markup is reduced to
// plain text, so paragraphs, list items and <br> do not run together.
const SCE_REBLOG_BLOCK_TAGS = new Set([
    'P', 'DIV', 'BR', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'TR', 'FIGURE', 'FIGCAPTION', 'HR'
]);

/**
 * Reduces a rendered element to plain text, inserting a space at block
 * boundaries so block elements stay separated once the text is collapsed to a
 * single line.
 */
function sceReblogElementToText(root) {
    const parts = [];
    const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                parts.push(child.nodeValue);
                return;
            }
            if (child.nodeType !== Node.ELEMENT_NODE) return;
            const isBlock = SCE_REBLOG_BLOCK_TAGS.has(child.tagName);
            if (isBlock) parts.push(' ');
            walk(child);
            if (isBlock) parts.push(' ');
        });
    };
    walk(root);
    return parts.join('').replace(/\s+/g, ' ').trim();
}

/**
 * Renders Markdown to plain text (used for the excerpt). Falls back to the
 * legacy regex stripper when Remarkable failed to load.
 */
function sceReblogMarkdownToText(markdown) {
    if (!markdown) return '';
    if (!sceReblogMarkdown) {
        return sceReblogStripMarkdown(markdown);
    }
    const container = sceReblogSanitizeHtml(sceReblogMarkdown.render(String(markdown)));
    return sceReblogElementToText(container);
}

/**
 * Renders Markdown into `parent` as sanitized DOM. Falls back to the legacy
 * inline renderer when Remarkable failed to load.
 */
function sceReblogRenderMarkdownInto(parent, text) {
    const source = String(text == null ? '' : text);
    if (!sceReblogMarkdown) {
        sceReblogRenderInlineMarkdown(parent, source);
        return;
    }
    const container = sceReblogSanitizeHtml(sceReblogMarkdown.render(source));
    while (container.firstChild) {
        parent.appendChild(container.firstChild);
    }
}

/**
 * Builds a plain-text excerpt from the beginning of the original post.
 */
function sceReblogBuildExcerpt(body, maxLength = SCE_REBLOG_EXCERPT_LENGTH) {
    const plain = sceReblogMarkdownToText(body);
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
function sceReblogBuildBody(comment, excerpt, author, permlink, title, labels, reblogger, thumbnail, beneficiaryPercent) {
    const relativeUrl = `/@${author}/${permlink}`;
    const linkText = sceReblogSanitizeLinkText(title || `${author}/${permlink}`);
    const lines = [];

    // The image is included in the body (not only json_metadata) because some
    // Condenser front ends (e.g. steemit.com) derive the feed thumbnail from the
    // body's first image rather than from json_metadata.image. It is wrapped in
    // a right-floated <div> (Condenser whitelists the "pull-right" class) so the
    // surrounding text wraps around it.
    if (thumbnail) {
        const safeUrl = sceReblogEscapeHtmlAttribute(relativeUrl);
        const safeSrc = sceReblogEscapeHtmlAttribute(thumbnail);
        const safeAlt = sceReblogEscapeHtmlAttribute(String(title || '').trim());
        lines.push('<div class="pull-right">');
        lines.push('');
        lines.push(`<a href="${safeUrl}"><img src="${safeSrc}" alt="${safeAlt}" /></a>`);
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
        trailingNotes.push(labels.beneficiaryNote.replace('{percent}', beneficiaryPercent).replace('{author}', author));
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
        // Reject anything that is not a plain http(s) URL so a crafted original
        // post cannot inject markup into the reblog body through its thumbnail.
        if (trimmed.length > SCE_REBLOG_MAX_IMAGE_URL_LENGTH) return;
        if (SCE_REBLOG_SAFE_IMAGE_URL_REGEX.test(trimmed) && !images.includes(trimmed)) {
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
 * Finalizes a tag list: normalizes it, caps it at SCE_REBLOG_MAX_TAGS and, when
 * `addMarker` is true (the default), guarantees the SCE_REBLOG_MARKER_TAG is
 * present (replacing the last tag when the list is already full). Pass
 * `addMarker = false` to respect the given tags verbatim, e.g. when the user has
 * deliberately removed the marker tag.
 */
function sceReblogFinalizeTags(rawList, addMarker = true) {
    const tags = sceReblogNormalizeTags(rawList);
    if (!tags.length) tags.push('steem');

    if (tags.includes(SCE_REBLOG_MARKER_TAG) || !addMarker) {
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
 * (a percentage of author rewards to the original author) is attached to the
 * `comment_options` op and applies to the new post.
 */
function sceReblogBuildOperations({ username, info, content, title, body, tags, images, beneficiaryWeight }) {
    const userProvidedTags = Array.isArray(tags) && tags.length;
    const tagInput = userProvidedTags ? tags : sceReblogDefaultTagList(content);
    // Respect the tags the user submitted: do not re-add the marker tag if the
    // user removed it in the dialog.
    const finalTags = sceReblogFinalizeTags(tagInput, !userProvidedTags);
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

    // Stay within the bridge's limits (see reblogBridge.js) so the broadcast is
    // never rejected for an over-long title or body.
    const safeTitle = String(title || '').slice(0, SCE_REBLOG_MAX_TITLE_LENGTH);
    const safeBody = String(body || '').slice(0, SCE_REBLOG_MAX_BODY_LENGTH);

    const operations = [
        ['comment', {
            parent_author: '',
            parent_permlink: parentPermlink,
            author: username,
            permlink: permlink,
            title: safeTitle,
            body: safeBody,
            json_metadata: JSON.stringify(jsonMetadata)
        }]
    ];

    // Beneficiaries only make sense when reblogging someone else's post.
    const extensions = [];
    if (info.author && info.author !== username) {
        extensions.push([0, {
            beneficiaries: [{ account: info.author, weight: beneficiaryWeight }]
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
 * Inserts Markdown at the current selection of `textarea`: wraps the selection
 * when the syntax has a prefix and suffix, or prefixes each selected line
 * otherwise. Refreshes the preview via an `input` event.
 */
function sceReblogApplyMarkdown(textarea, kind) {
    if (!textarea) return;

    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    const wrap = (prefix, suffix, placeholder) => {
        const inner = selected || placeholder;
        return { text: prefix + inner + suffix, selStart: start + prefix.length, selEnd: start + prefix.length + inner.length };
    };
    const prefixLines = (prefix, placeholder) => {
        const inner = selected || placeholder;
        const text = inner.split('\n').map((line) => prefix + line).join('\n');
        return { text: text, selStart: start, selEnd: start + text.length };
    };

    let change;
    switch (kind) {
        case 'bold': change = wrap('**', '**', 'bold text'); break;
        case 'italic': change = wrap('*', '*', 'italic text'); break;
        case 'strikethrough': change = wrap('~~', '~~', 'strikethrough'); break;
        case 'code': change = wrap('`', '`', 'code'); break;
        case 'heading': change = prefixLines('## ', 'Heading'); break;
        case 'quote': change = prefixLines('> ', 'Quote'); break;
        case 'bulletList': change = prefixLines('- ', 'List item'); break;
        case 'numberedList': change = prefixLines('1. ', 'List item'); break;
        case 'link': change = wrap('[', '](https://)', 'link text'); break;
        case 'image': change = wrap('![', '](https://)', 'alt text'); break;
        case 'codeBlock': {
            const inner = selected || 'code';
            const text = '```\n' + inner + '\n```';
            change = { text: text, selStart: start + 4, selEnd: start + 4 + inner.length };
            break;
        }
        default: return;
    }

    if (typeof textarea.setRangeText === 'function') {
        textarea.setRangeText(change.text, start, end, 'end');
    } else {
        textarea.value = value.slice(0, start) + change.text + value.slice(end);
    }

    textarea.focus();
    textarea.setSelectionRange(change.selStart, change.selEnd);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Builds the Markdown toolbar for the comment editor. Each button inserts the
 * matching snippet into the textarea (see sceReblogApplyMarkdown).
 */
function sceReblogBuildToolbar(labels) {
    const toolbar = document.createElement('div');
    toolbar.className = 'sce-reblog-toolbar';

    const actions = [
        ['bold', 'B', labels.toolbarBold],
        ['italic', 'I', labels.toolbarItalic],
        ['strikethrough', 'S', labels.toolbarStrikethrough],
        ['heading', 'H', labels.toolbarHeading],
        ['quote', '\u201C', labels.toolbarQuote],
        ['code', '</>', labels.toolbarCode],
        ['codeBlock', '{ }', labels.toolbarCodeBlock],
        ['bulletList', '\u2022', labels.toolbarBulletList],
        ['numberedList', '1.', labels.toolbarNumberedList],
        ['link', '\uD83D\uDD17', labels.toolbarLink],
        ['image', '\uD83D\uDDBC', labels.toolbarImage]
    ];

    actions.forEach(([kind, symbol, title]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sce-reblog-toolbar-button';
        button.dataset.kind = kind;
        button.textContent = symbol;
        if (title) {
            button.title = title;
            button.setAttribute('aria-label', title);
        }
        toolbar.appendChild(button);
    });

    return toolbar;
}

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

    const headerActions = document.createElement('div');
    headerActions.className = 'sce-reblog-modal-actions';
    const maximize = document.createElement('button');
    maximize.type = 'button';
    maximize.className = 'sce-reblog-modal-action';
    maximize.textContent = labels.maximize;
    maximize.title = labels.maximize;
    maximize.setAttribute('aria-label', labels.maximize);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'sce-reblog-modal-close';
    close.setAttribute('aria-label', labels.cancel);
    close.textContent = '\u00D7';
    headerActions.appendChild(maximize);
    headerActions.appendChild(close);
    header.appendChild(title);
    header.appendChild(headerActions);

    const body = document.createElement('div');
    body.className = 'sce-reblog-modal-body';

    const titleLabel = document.createElement('label');
    titleLabel.className = 'sce-reblog-label';
    titleLabel.textContent = labels.titleLabel;
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'sce-reblog-title-input';
    titleInput.maxLength = SCE_REBLOG_MAX_TITLE_LENGTH;

    const commentLabel = document.createElement('label');
    commentLabel.className = 'sce-reblog-label';
    commentLabel.textContent = labels.commentLabel;
    const commentInput = document.createElement('textarea');
    commentInput.className = 'sce-reblog-comment-input';
    commentInput.rows = 5;
    commentInput.maxLength = SCE_REBLOG_MAX_COMMENT_LENGTH;
    commentInput.placeholder = labels.commentPlaceholder;

    const toolbar = sceReblogBuildToolbar(labels);

    const tagsLabel = document.createElement('label');
    tagsLabel.className = 'sce-reblog-label';
    tagsLabel.textContent = labels.tagsLabel;
    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.className = 'sce-reblog-tags-input';
    tagsInput.placeholder = labels.tagsPlaceholder;

    const includeImageLabel = document.createElement('label');
    includeImageLabel.className = 'sce-reblog-toggle-label';
    const includeImage = document.createElement('input');
    includeImage.type = 'checkbox';
    includeImage.className = 'sce-reblog-include-image';
    includeImage.checked = true;
    includeImageLabel.appendChild(includeImage);
    includeImageLabel.appendChild(document.createTextNode(` ${labels.includeImageLabel}`));

    const postPreviewLabel = document.createElement('label');
    postPreviewLabel.className = 'sce-reblog-label';
    postPreviewLabel.textContent = labels.postPreviewLabel;

    const layoutToggle = document.createElement('button');
    layoutToggle.type = 'button';
    layoutToggle.className = 'sce-reblog-layout-toggle';
    layoutToggle.textContent = labels.sideBySide;
    layoutToggle.title = labels.sideBySide;

    const previewHeader = document.createElement('div');
    previewHeader.className = 'sce-reblog-preview-header';
    previewHeader.appendChild(postPreviewLabel);
    previewHeader.appendChild(layoutToggle);

    const postPreview = document.createElement('div');
    postPreview.className = 'sce-reblog-post-preview';

    const beneficiaryLabel = document.createElement('label');
    beneficiaryLabel.className = 'sce-reblog-label';
    beneficiaryLabel.textContent = labels.beneficiaryLabel;
    const beneficiarySelect = document.createElement('select');
    beneficiarySelect.className = 'sce-reblog-beneficiary-select';
    SCE_REBLOG_BENEFICIARY_PERCENTAGES.forEach((percent) => {
        const option = document.createElement('option');
        option.value = String(percent);
        option.textContent = `${percent}%`;
        beneficiarySelect.appendChild(option);
    });
    beneficiarySelect.value = String(SCE_REBLOG_DEFAULT_BENEFICIARY_PERCENT);

    const beneficiary = document.createElement('div');
    beneficiary.className = 'sce-reblog-beneficiary';

    const status = document.createElement('div');
    status.className = 'sce-reblog-status';

    // Editor pane: everything the user fills in.
    const editorPane = document.createElement('div');
    editorPane.className = 'sce-reblog-editor-pane';
    editorPane.appendChild(titleLabel);
    editorPane.appendChild(titleInput);
    editorPane.appendChild(commentLabel);
    editorPane.appendChild(toolbar);
    editorPane.appendChild(commentInput);
    editorPane.appendChild(tagsLabel);
    editorPane.appendChild(tagsInput);
    editorPane.appendChild(includeImageLabel);
    editorPane.appendChild(beneficiaryLabel);
    editorPane.appendChild(beneficiarySelect);
    editorPane.appendChild(beneficiary);

    // Preview pane: the live post preview (can sit beside the editor).
    const previewPane = document.createElement('div');
    previewPane.className = 'sce-reblog-preview-pane';
    previewPane.appendChild(previewHeader);
    previewPane.appendChild(postPreview);

    body.appendChild(editorPane);
    body.appendChild(previewPane);
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

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'sce-reblog-resize-handle';
    resizeHandle.setAttribute('aria-hidden', 'true');

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    modal.appendChild(resizeHandle);
    backdrop.appendChild(modal);

    return { backdrop, modal, close, maximize, layoutToggle, resizeHandle, cancel, submit, titleInput, commentInput, tagsInput, includeImage, postPreview, beneficiaryLabel, beneficiarySelect, beneficiary, status, toolbar };
}

/**
 * Wires the dialog sizing controls: the bottom-right resize grip, the
 * maximize/restore button, and the side-by-side / stacked layout toggle.
 * @param {object} ui     Refs returned by sceReblogBuildModal.
 * @param {object} labels Localized labels.
 */
function sceReblogWireDialogSizing(ui, labels) {
    const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
    const inlineSize = () => ({
        width: ui.modal.style.width,
        height: ui.modal.style.height,
        maxHeight: ui.modal.style.maxHeight
    });
    const applyInlineSize = (size) => {
        ui.modal.style.width = size.width || '';
        ui.modal.style.height = size.height || '';
        ui.modal.style.maxHeight = size.maxHeight || '';
    };
    const setExplicitSize = (width, height) => {
        ui.modal.style.width = `${Math.round(width)}px`;
        ui.modal.style.height = `${Math.round(height)}px`;
        ui.modal.style.maxHeight = 'none';
    };

    // Resize by dragging the bottom-right grip.
    ui.resizeHandle.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        const rect = ui.modal.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = rect.width;
        const startHeight = rect.height;
        ui.resizeHandle.setPointerCapture(event.pointerId);

        const onMove = withSilentMutations((moveEvent) => {
            const width = clampValue(startWidth + (moveEvent.clientX - startX), SCE_REBLOG_MIN_MODAL_WIDTH, window.innerWidth - 16);
            const height = clampValue(startHeight + (moveEvent.clientY - startY), SCE_REBLOG_MIN_MODAL_HEIGHT, window.innerHeight - 16);
            setExplicitSize(width, height);
        });
        const onEnd = () => {
            ui.resizeHandle.removeEventListener('pointermove', onMove);
            ui.resizeHandle.removeEventListener('pointerup', onEnd);
            ui.resizeHandle.removeEventListener('pointercancel', onEnd);
        };
        ui.resizeHandle.addEventListener('pointermove', onMove);
        ui.resizeHandle.addEventListener('pointerup', onEnd);
        ui.resizeHandle.addEventListener('pointercancel', onEnd);
    });

    // Maximize / restore.
    let maximized = false;
    let preMaximizeSize = null;
    const setMaximized = (next) => {
        if (next === maximized) return;
        if (next) {
            preMaximizeSize = inlineSize();
            ui.modal.classList.add('sce-reblog-modal-maximized');
            setExplicitSize(window.innerWidth - 24, window.innerHeight - 24);
        } else {
            ui.modal.classList.remove('sce-reblog-modal-maximized');
            applyInlineSize(preMaximizeSize || { width: '', height: '', maxHeight: '' });
        }
        maximized = next;
        ui.maximize.textContent = maximized ? labels.restore : labels.maximize;
        ui.maximize.title = maximized ? labels.restore : labels.maximize;
        ui.maximize.setAttribute('aria-label', maximized ? labels.restore : labels.maximize);
    };
    ui.maximize.addEventListener('click', () => setMaximized(!maximized));

    // Side-by-side / stacked layout.
    let sideBySide = false;
    let preLayoutSize = null;
    const setSideBySide = (next) => {
        if (next === sideBySide) return;
        if (next) {
            preLayoutSize = inlineSize();
            const rect = ui.modal.getBoundingClientRect();
            if (!maximized && rect.width < SCE_REBLOG_SIDE_BY_SIDE_WIDTH) {
                setExplicitSize(Math.min(SCE_REBLOG_SIDE_BY_SIDE_WIDTH, window.innerWidth - 24), rect.height);
            }
            ui.modal.classList.add('sce-reblog-side-by-side');
        } else {
            ui.modal.classList.remove('sce-reblog-side-by-side');
            if (!maximized) applyInlineSize(preLayoutSize || { width: '', height: '', maxHeight: '' });
        }
        sideBySide = next;
        ui.layoutToggle.textContent = sideBySide ? labels.stacked : labels.sideBySide;
        ui.layoutToggle.title = sideBySide ? labels.stacked : labels.sideBySide;
    };
    ui.layoutToggle.addEventListener('click', () => setSideBySide(!sideBySide));
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

        const href = match[2].trim();
        const isExternal = /^https?:\/\//i.test(href);
        const isRelative = /^\/(?!\/)/.test(href) || href.startsWith('#');

        if (isExternal || isRelative) {
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.textContent = match[1];
            anchor.rel = 'noopener noreferrer';
            if (isExternal) {
                anchor.target = '_blank';
            }
            parent.appendChild(anchor);
        } else {
            // Unsafe scheme (e.g. javascript:, data:): render as plain text.
            parent.appendChild(document.createTextNode(match[0]));
        }

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
function sceReblogRenderPreview(container, { comment, excerpt, author, permlink, title, labels, reblogger, thumbnail, beneficiaryPercent }) {
    container.textContent = '';

    const relativeUrl = `/@${author}/${permlink}`;
    const linkText = title || `${author}/${permlink}`;
    const mention = (reblogger && reblogger === author) ? '' : `@${author}`;

    if (thumbnail) {
        const imgLink = document.createElement('a');
        imgLink.href = relativeUrl;
        const img = document.createElement('img');
        img.className = 'sce-reblog-preview-thumbnail';
        img.src = thumbnail;
        img.alt = title || '';
        imgLink.appendChild(img);
        container.appendChild(imgLink);
    }

    if (comment && comment.trim()) {
        const commentEl = document.createElement('div');
        commentEl.className = 'sce-reblog-preview-comment sce-reblog-markdown';
        sceReblogRenderMarkdownInto(commentEl, comment.trim());
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
        trailingNotes.push(labels.beneficiaryNote.replace('{percent}', beneficiaryPercent).replace('{author}', author));
    }
    if (trailingNotes.length) {
        const attributionEl = document.createElement('div');
        attributionEl.className = 'sce-reblog-preview-attribution sce-reblog-markdown';
        sceReblogRenderMarkdownInto(attributionEl, `_${trailingNotes.join(' ')}_`);
        container.appendChild(attributionEl);
    }
}

/**
 * Opens the reblog dialog for a post. Handles login/Keychain checks, fetches
 * the original post, and wires up the broadcast on submit.
 */
/** Minimum number of words in the user's own comment before a reblog warns. */
const SCE_REBLOG_MIN_COMMENT_WORDS = 100;
/** Community tag (e.g. hive-100421); the first tag selects the target community. */
const SCE_REBLOG_COMMUNITY_TAG_REGEX = /^hive-\d+$/i;

/**
 * Counts the words in a piece of text (whitespace-separated tokens).
 * @param {string} text
 * @returns {number}
 */
function sceReblogCountWords(text) {
    const trimmed = String(text || '').trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Best-effort, time-boxed lookup of a community's human-readable name for a
 * hive-#### tag. Returns null when it cannot be resolved, so callers can fall
 * back to showing just the tag.
 * @param {string} tag
 * @param {number} timeoutMs
 * @returns {Promise<string|null>}
 */
async function sceReblogResolveCommunityName(tag, timeoutMs = 4000) {
    if (typeof getCommunityInfo !== 'function') return null;
    try {
        const info = await Promise.race([
            getCommunityInfo(steemApi, tag),
            new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
        ]);
        const name = info && (info.title || info.name);
        return (typeof name === 'string' && name.trim()) ? name.trim() : null;
    } catch (error) {
        console.warn('SCE: Unable to resolve community name for reblog warning:', error);
        return null;
    }
}

/**
 * Collects the warnings the user should confirm before broadcasting.
 * @param {string[]} tags - The raw tag list; tags[0] becomes the parent permlink.
 * @param {string} comment - The user's own comment text.
 * @param {object} labels - Localized reblog labels.
 * @returns {Promise<string[]>} Warning messages (empty when there is nothing to warn about).
 */
async function sceReblogCollectWarnings(tags, comment, labels) {
    const warnings = [];

    if (Array.isArray(tags) && tags.length && SCE_REBLOG_COMMUNITY_TAG_REGEX.test(tags[0])) {
        const tag = tags[0];
        const name = await sceReblogResolveCommunityName(tag);
        // Show both the tag and, when known, the community's display name.
        const community = (name && name.toLowerCase() !== tag.toLowerCase()) ? `${tag} — ${name}` : tag;
        warnings.push(labels.communityWarning.replace('{tag}', community));
    }

    const wordCount = sceReblogCountWords(comment);
    if (wordCount === 0) {
        warnings.push(labels.emptyCommentWarning);
    } else if (wordCount < SCE_REBLOG_MIN_COMMENT_WORDS) {
        warnings.push(labels.shortDescriptionWarning);
    }

    return warnings;
}

/**
 * Shows a modal confirmation listing the given warning messages. Resolves true
 * when the user confirms, false when they cancel (button, backdrop click or
 * Escape).
 * @param {string[]} messages
 * @param {object} labels
 * @returns {Promise<boolean>}
 */
function sceReblogConfirm(messages, labels) {
    return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'sce-reblog-modal-backdrop sce-reblog-confirm-backdrop';

        const modal = document.createElement('div');
        modal.className = 'sce-reblog-modal sce-reblog-confirm-modal';

        const header = document.createElement('div');
        header.className = 'sce-reblog-modal-header';
        const title = document.createElement('span');
        title.className = 'sce-reblog-modal-title';
        title.textContent = labels.confirmTitle;
        header.appendChild(title);

        const body = document.createElement('div');
        body.className = 'sce-reblog-confirm-list';
        messages.forEach((message) => {
            const p = document.createElement('p');
            p.textContent = message;
            body.appendChild(p);
        });

        const footer = document.createElement('div');
        footer.className = 'sce-reblog-modal-footer';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'sce-reblog-cancel';
        cancel.textContent = labels.cancel;
        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'sce-reblog-submit';
        confirm.textContent = labels.confirmButton;
        footer.appendChild(cancel);
        footer.appendChild(confirm);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        let settled = false;
        const finish = (value) => {
            if (settled) return;
            settled = true;
            document.removeEventListener('keydown', onKeydown, true);
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            resolve(value);
        };
        // Capture phase so Escape cancels only this confirmation and does not
        // also trigger the main dialog's Escape handler.
        function onKeydown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                finish(false);
            }
        }

        cancel.addEventListener('click', () => finish(false));
        confirm.addEventListener('click', () => finish(true));
        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop) finish(false);
        });
        document.addEventListener('keydown', onKeydown, true);

        withSilentMutations(() => document.body.appendChild(backdrop))();
        confirm.focus();
    });
}

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

    // Replies have no title, tags or image of their own, so a reblog of a reply
    // inherits those attributes from the top-level (root) post. Fetch the root
    // post once and reuse it for the title, image and tags below.
    const isReply = (content.depth > 0) || !!(content.parent_author);
    let rootContent = null;
    if (isReply && content.root_author && content.root_permlink) {
        try {
            rootContent = await getContent(content.root_author, content.root_permlink);
        } catch (error) {
            console.warn('SCE: Failed to fetch root post for reblog:', error);
        }
    }
    const sourceContent = rootContent || content;

    // Image: use the reply's own image when it has one, otherwise fall back to
    // the root post's image.
    let images = sceReblogExtractImages(content);
    if (isReply && !images.length && rootContent) {
        images = sceReblogExtractImages(rootContent);
    }
    const thumbnail = images[0] || null;

    // Title: replies inherit the root post's title instead of falling back to
    // the author/permlink.
    let effectiveTitle = content.title || '';
    if (isReply) {
        effectiveTitle = content.root_title || (rootContent && rootContent.title) || effectiveTitle;
    }

    const titlePrefix = isReply ? labels.titleReplyPrefix : labels.titlePrefix;
    const defaultTitle = `${titlePrefix} ${effectiveTitle || `${info.author}/${info.permlink}`}`
        .slice(0, SCE_REBLOG_MAX_TITLE_LENGTH);

    const ui = sceReblogBuildModal(labels);
    ui.titleInput.value = defaultTitle;
    ui.tagsInput.value = sceReblogComputeTags(sourceContent).join(', ');

    // Image inclusion: default to including the thumbnail when the post has one.
    ui.includeImage.checked = !!thumbnail;
    ui.includeImage.disabled = !thumbnail;

    // Beneficiaries only apply when reblogging someone else's post.
    const isSelfReblog = !(info.author && info.author !== username);
    if (isSelfReblog) {
        ui.beneficiaryLabel.style.display = 'none';
        ui.beneficiarySelect.style.display = 'none';
    }

    const getBeneficiaryPercent = () => parseInt(ui.beneficiarySelect.value, 10);

    const updateBeneficiaryNote = () => {
        if (isSelfReblog) return;
        ui.beneficiary.textContent = labels.beneficiaryNote
            .replace('{percent}', getBeneficiaryPercent())
            .replace('{author}', info.author);
    };
    updateBeneficiaryNote();

    // Live preview of the full post that will be broadcast (rendered as DOM).
    const updatePostPreview = () => {
        sceReblogRenderPreview(ui.postPreview, {
            comment: ui.commentInput.value,
            excerpt: excerpt,
            author: info.author,
            permlink: info.permlink,
            title: effectiveTitle,
            labels: labels,
            reblogger: username,
            thumbnail: ui.includeImage.checked ? thumbnail : null,
            beneficiaryPercent: getBeneficiaryPercent()
        });
    };
    updatePostPreview();
    ui.commentInput.addEventListener('input', updatePostPreview);
    ui.includeImage.addEventListener('change', updatePostPreview);

    // Markdown toolbar: insert the requested snippet into the comment box.
    ui.toolbar.addEventListener('click', (event) => {
        const button = event.target.closest('.sce-reblog-toolbar-button');
        if (button) {
            sceReblogApplyMarkdown(ui.commentInput, button.dataset.kind);
        }
    });

    ui.beneficiarySelect.addEventListener('change', () => {
        updateBeneficiaryNote();
        updatePostPreview();
    });

    // Sizing controls: drag-resize, maximize/restore, side-by-side layout.
    sceReblogWireDialogSizing(ui, labels);

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
        const comment = ui.commentInput.value;
        const tags = ui.tagsInput.value.split(/[\s,]+/).filter(Boolean);

        // Warn (and require confirmation) before broadcasting when the first tag
        // targets a community or when the user's own comment is very short.
        const warnings = await sceReblogCollectWarnings(tags, comment, labels);
        if (warnings.length) {
            const proceed = await sceReblogConfirm(warnings, labels);
            if (!proceed) {
                // Return focus to the user's own text so they can revise it.
                ui.commentInput.focus();
                return;
            }
        }

        const includeImage = ui.includeImage.checked;
        const beneficiaryPercent = getBeneficiaryPercent();
        const body = sceReblogBuildBody(comment, excerpt, info.author, info.permlink, effectiveTitle, labels, username, includeImage ? thumbnail : null, beneficiaryPercent);
        const operations = sceReblogBuildOperations({ username, info, content: sourceContent, title, body, tags, images: includeImage ? images : [], beneficiaryWeight: beneficiaryPercent * 100 });

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
    // The top post of a feed/blog is rendered as an expanded full post that
    // still carries a summary header; that header already received a reblog
    // icon above, so skip the duplicate next to the native Reblog button. The
    // dedicated full-post page has no summary header, so its Reblog button
    // still gets an icon.
    const reblogPostItem = reblogAnchor ? reblogAnchor.closest('li') : null;
    const isExpandedFeedPost = !!(reblogPostItem && reblogPostItem.querySelector('.articles__summary-header'));
    const shareContainer = reblogAnchor ? reblogAnchor.parentNode : document.querySelector('.RightShare__Menu');
    if (!isExpandedFeedPost && shareContainer && !shareContainer.querySelector('.sce-reblog-button')) {
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
