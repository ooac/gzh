import { marked } from 'marked'

export type ThemeType = 'hammer' | 'hammer-beige' | 'fresh-green' | 'default' | 'dark' | 'aurora'

// Dark Theme Styles (Deep Black - Zinc Palette)
const darkStyles = {
    h1: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block; font-weight: bold;',
        content: 'font-size: 24px; color: rgb(250, 250, 250); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;'
    },
    h2: {
        container: 'border-bottom: 1px solid rgb(63, 63, 70); margin: 30px 0 15px 0; padding: 10px 0; display: block; text-align: left;',
        spanTop: 'display: none;',
        prefix: 'display: none;',
        content: 'font-size: 22px; color: rgb(250, 250, 250); line-height: 1.2em; display: inline-block; font-weight: bold;',
        suffix: 'display: none;',
        spanBottom: 'display: none;'
    },
    h3: {
        container: 'margin-top: 30px; margin-bottom: 15px; display: block; line-height: 1.5em;',
        content: 'font-size: 18px; color: rgb(250, 250, 250); line-height: 1.5em; padding: 2px 0; display: block; font-weight: bold; border-left: 4px solid rgb(250, 250, 250); padding-left: 10px;'
    },
    p: 'color: rgb(212, 212, 216); font-size: 17px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;',
    blockquote: {
        container: 'margin: 20px 0px; padding: 10px 20px; border-left: 4px solid rgb(113, 113, 122); background-color: rgba(255, 255, 255, 0.05); display: block;',
        p: 'color: rgb(161, 161, 170); font-size: 17px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;'
    },
    ul: 'list-style-type: disc; margin: 8px 0px; padding-left: 25px; color: rgb(212, 212, 216);',
    ol: 'list-style-type: decimal; margin: 8px 0px; padding-left: 25px; color: rgb(212, 212, 216);',
    li: {
        section: 'margin: 5px 0px; color: rgb(212, 212, 216); font-size: 17px; line-height: 1.8em; text-align: left;'
    },
    strong: 'color: rgb(250, 250, 250); font-weight: bold;',
    link: 'color: rgb(250, 250, 250); text-decoration: underline; text-decoration-color: rgb(161, 161, 170);',
    codespan: 'background-color: rgba(255, 255, 255, 0.1); color: rgb(250, 250, 250); padding: 2px 4px; border-radius: 4px; font-family: monospace;',
    code: 'background-color: rgb(24, 24, 27); color: rgb(228, 228, 231); padding: 15px; border-radius: 8px; border: 1px solid rgb(39, 39, 42); overflow-x: auto; font-family: monospace; display: block; margin: 15px 0;',
    image: 'max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 20px auto;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; color: rgb(212, 212, 216);',
    th: 'border-bottom: 2px solid rgb(63, 63, 70); padding: 12px 8px; text-align: left; font-weight: bold; color: rgb(250, 250, 250);',
    td: 'border-bottom: 1px solid rgb(39, 39, 42); padding: 12px 8px;',
    hr: 'border: 0; border-top: 1px solid rgb(63, 63, 70); margin: 30px 0;'
}

// Aurora Theme Styles (Aurora Purple - Slate/Purple Palette)
const auroraStyles = {
    h1: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block; font-weight: bold;',
        content: 'font-size: 24px; color: rgb(248, 250, 252); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;'
    },
    h2: {
        container: 'border-bottom: 2px solid rgb(168, 85, 247); margin: 30px 0 15px 0; padding: 10px 0; display: block; text-align: left;',
        spanTop: 'display: none;',
        prefix: 'display: none;',
        content: 'font-size: 22px; color: rgb(248, 250, 252); line-height: 1.2em; display: inline-block; font-weight: bold;',
        suffix: 'display: none;',
        spanBottom: 'display: none;'
    },
    h3: {
        container: 'margin-top: 30px; margin-bottom: 15px; display: block; line-height: 1.5em;',
        content: 'font-size: 18px; color: rgb(248, 250, 252); line-height: 1.5em; padding: 2px 0; display: block; font-weight: bold; border-left: 4px solid rgb(192, 132, 252); padding-left: 10px;'
    },
    p: 'color: rgb(203, 213, 225); font-size: 17px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;',
    blockquote: {
        container: 'margin: 20px 0px; padding: 10px 20px; border-left: 4px solid rgb(168, 85, 247); background-color: rgba(168, 85, 247, 0.1); display: block;',
        p: 'color: rgb(203, 213, 225); font-size: 17px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;'
    },
    ul: 'list-style-type: disc; margin: 8px 0px; padding-left: 25px; color: rgb(203, 213, 225);',
    ol: 'list-style-type: decimal; margin: 8px 0px; padding-left: 25px; color: rgb(203, 213, 225);',
    li: {
        section: 'margin: 5px 0px; color: rgb(203, 213, 225); font-size: 17px; line-height: 1.8em; text-align: left;'
    },
    strong: 'color: rgb(248, 250, 252); font-weight: bold;',
    link: 'color: rgb(192, 132, 252); text-decoration: underline;',
    codespan: 'background-color: rgba(30, 41, 59, 0.5); color: rgb(248, 250, 252); padding: 2px 4px; border-radius: 4px; font-family: monospace;',
    code: 'background-color: rgb(2, 6, 23); color: rgb(226, 232, 240); padding: 15px; border-radius: 8px; border: 1px solid rgb(51, 65, 85); overflow-x: auto; font-family: monospace; display: block; margin: 15px 0;',
    image: 'max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 20px auto;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; color: rgb(203, 213, 225);',
    th: 'border-bottom: 2px solid rgb(168, 85, 247); padding: 12px 8px; text-align: left; font-weight: bold; color: rgb(248, 250, 252);',
    td: 'border-bottom: 1px solid rgb(51, 65, 85); padding: 12px 8px;',
    hr: 'border: 0; border-top: 1px solid rgb(51, 65, 85); margin: 30px 0;'
}

// Minimalist Black Theme Styles (Original 'hammer')
const minimalistStyles = {
    h1: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block; font-weight: bold;',
        content: 'font-size: 24px; color: rgb(0, 0, 0); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;'
    },
    h2: {
        container: 'color: rgb(0, 0, 0); border: 1px solid rgb(0, 0, 0); margin: 30px 30px 15px 30px; padding: 12px 0px; display: block; text-align: center; position: relative;',
        spanTop: 'border-top: 1px solid rgb(0, 0, 0); display: block; float: left; height: 1px; width: 90%; margin-top: -17px; margin-left: -5px;',
        prefix: 'background-color: rgb(0, 0, 0); box-shadow: rgb(0, 0, 0) 3px 0px, rgb(0, 0, 0) 0px 3px, rgb(0, 0, 0) -3px 0px, rgb(0, 0, 0) 0px -3px; display: block; height: 3px; width: 3px; margin-left: 5%;',
        content: 'font-size: 22px; color: rgb(0, 0, 0); line-height: 1.2em; display: inline-block; font-weight: bold;',
        suffix: 'background-color: rgb(0, 0, 0); box-shadow: rgb(0, 0, 0) 3px 0px, rgb(0, 0, 0) 0px 3px, rgb(0, 0, 0) -3px 0px, rgb(0, 0, 0) 0px -3px; display: block; height: 3px; width: 3px; margin-left: 95%;',
        spanBottom: 'border-bottom: 1px solid rgb(0, 0, 0); display: block; float: right; height: 1px; width: 90%; margin-top: 16px; margin-right: -5px;'
    },
    h3: {
        container: 'margin-top: 30px; margin-bottom: 15px; display: flex; justify-content: center; line-height: 1.5em;',
        content: 'font-size: 18px; color: rgb(255, 255, 255); background-color: rgb(0, 0, 0); line-height: 1.5em; padding: 2px 10px; display: block; font-weight: bold;'
    },
    p: 'color: rgb(0, 0, 0); font-size: 17px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;',
    blockquote: {
        container: 'margin: 20px 0px; padding: 10px 20px 10px 20px; border-left: 3px solid rgba(0, 0, 0, 0.65); border-right: 1px solid rgba(0, 0, 0, 0.65); border-top: 3px solid rgba(0, 0, 0, 0.4); border-bottom: 3px solid rgba(0, 0, 0, 0.4); background-color: rgba(249, 249, 249, 0.76); display: block;',
        p: 'color: rgb(0, 0, 0); font-size: 17px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;'
    },
    ul: 'list-style-type: square; margin: 8px 0px; padding-left: 25px; color: rgb(0, 0, 0);',
    ol: 'list-style-type: decimal; margin: 8px 0px; padding-left: 25px; color: rgb(0, 0, 0);',
    li: {
        section: 'margin: 5px 0px; color: rgb(1, 1, 1); font-size: 17px; line-height: 1.8em; text-align: left;'
    },
    link: 'color: rgb(0, 0, 0); text-decoration: underline;',
    codespan: 'background-color: rgba(0, 0, 0, 0.05); color: rgb(0, 0, 0); padding: 2px 4px; border-radius: 4px; font-family: monospace;',
    code: 'background-color: rgb(245, 245, 245); color: rgb(0, 0, 0); padding: 15px; border-radius: 8px; border: 1px solid rgb(230, 230, 230); overflow-x: auto; font-family: monospace; display: block; margin: 15px 0;',
    image: 'max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 20px auto;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; color: rgb(0, 0, 0);',
    th: 'border-bottom: 2px solid rgb(0, 0, 0); padding: 12px 8px; text-align: left; font-weight: bold; color: rgb(0, 0, 0);',
    td: 'border-bottom: 1px solid rgb(200, 200, 200); padding: 12px 8px;',
    hr: 'border: 0; border-top: 1px solid rgb(200, 200, 200); margin: 30px 0;'
}

// Hammer Beige Theme Styles
const hammerBeigeStyles = {
    h1: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block;',
        content: 'font-size: 24px; color: rgb(99, 87, 83); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;'
    },
    h2: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block;',
        spanTop: 'display: none;',
        prefix: 'display: none;',
        content: 'font-size: 22px; color: rgb(99, 87, 83); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;',
        suffix: 'display: none;',
        spanBottom: 'display: none;'
    },
    h3: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block;',
        content: 'font-size: 20px; color: rgb(99, 87, 83); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;'
    },
    p: 'color: rgb(99, 87, 83); font-size: 17px; line-height: 1.8em; letter-spacing: 0em; text-align: left; margin: 0px; padding: 8px 0px;',
    blockquote: {
        container: 'margin: 20px 0px; padding: 10px 20px 10px 20px; border-left: 3px solid rgba(0, 0, 0, 0.4); border-right: none; border-top: none; border-bottom: none; background-color: rgba(0, 0, 0, 0.05); display: block;',
        p: 'color: rgb(99, 87, 83); font-size: 16px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;'
    },
    ul: 'list-style-type: disc; margin: 8px 0px; padding-left: 25px; color: rgb(0, 0, 0);',
    ol: 'list-style-type: decimal; margin: 8px 0px; padding-left: 25px; color: rgb(0, 0, 0);',
    li: {
        section: 'margin: 5px 0px; color: rgb(99, 87, 83); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left;'
    },
    link: 'color: rgb(99, 87, 83); text-decoration: underline;',
    codespan: 'background-color: rgba(99, 87, 83, 0.1); color: rgb(99, 87, 83); padding: 2px 4px; border-radius: 4px; font-family: monospace;',
    code: 'background-color: rgba(99, 87, 83, 0.05); color: rgb(99, 87, 83); padding: 15px; border-radius: 8px; border: 1px solid rgba(99, 87, 83, 0.1); overflow-x: auto; font-family: monospace; display: block; margin: 15px 0;',
    image: 'max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 20px auto;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; color: rgb(99, 87, 83);',
    th: 'border-bottom: 2px solid rgb(99, 87, 83); padding: 12px 8px; text-align: left; font-weight: bold; color: rgb(99, 87, 83);',
    td: 'border-bottom: 1px solid rgba(99, 87, 83, 0.2); padding: 12px 8px;',
    hr: 'border: 0; border-top: 1px solid rgba(99, 87, 83, 0.2); margin: 30px 0;'
}

// Fresh Green Theme Styles (嫩清)
const freshGreenStyles = {
    h1: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block;',
        content: 'font-size: 24px; color: rgb(89, 89, 89); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;'
    },
    h2: {
        container: 'border-bottom: 2px solid rgb(89, 89, 89); margin-top: 30px; margin-bottom: 15px; padding: 0px; display: flex;',
        spanTop: 'display: none;',
        prefix: 'display: none;',
        content: 'font-size: 22px; color: rgb(89, 89, 89); line-height: 1.5em; letter-spacing: 0em; font-weight: bold; display: block;',
        suffix: 'display: none;',
        spanBottom: 'display: none;'
    },
    h3: {
        container: 'margin-top: 30px; margin-bottom: 15px; padding: 0px; display: block;',
        content: 'font-size: 20px; color: rgb(89, 89, 89); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;'
    },
    p: 'color: rgb(89, 89, 89); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left; margin: 0px; padding: 8px 0px;',
    blockquote: {
        container: 'margin: 20px 0px; padding: 10px 20px; border: none; background-color: rgba(0, 0, 0, 0.05); display: block;',
        p: 'color: rgb(0, 0, 0); font-size: 16px; line-height: 1.8em; text-align: left; margin: 0px; padding: 8px 0px;'
    },
    ul: 'list-style-type: disc; margin: 8px 0px; padding-left: 25px; color: rgb(0, 0, 0);',
    ol: 'list-style-type: decimal; margin: 8px 0px; padding-left: 25px; color: rgb(0, 0, 0);',
    li: {
        section: 'margin: 5px 0px; color: rgb(1, 1, 1); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left;'
    },
    strong: 'color: rgb(71, 193, 168); font-weight: bold;',
    link: 'color: rgb(71, 193, 168); text-decoration: underline;',
    codespan: 'background-color: rgba(71, 193, 168, 0.1); color: rgb(71, 193, 168); padding: 2px 4px; border-radius: 4px; font-family: monospace;',
    code: 'background-color: rgba(71, 193, 168, 0.05); color: rgb(89, 89, 89); padding: 15px; border-radius: 8px; border: 1px solid rgba(71, 193, 168, 0.1); overflow-x: auto; font-family: monospace; display: block; margin: 15px 0;',
    image: 'max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 20px auto;',
    table: 'width: 100%; border-collapse: collapse; margin: 20px 0; color: rgb(89, 89, 89);',
    th: 'border-bottom: 2px solid rgb(71, 193, 168); padding: 12px 8px; text-align: left; font-weight: bold; color: rgb(89, 89, 89);',
    td: 'border-bottom: 1px solid rgba(71, 193, 168, 0.2); padding: 12px 8px;',
    hr: 'border: 0; border-top: 1px solid rgba(71, 193, 168, 0.2); margin: 30px 0;'
}

export function mdToHtml(md: string, theme?: ThemeType, includeContainer: boolean = false): string {
    // Use marked library for better markdown parsing
    const renderer = new marked.Renderer()

    const styles = theme === 'hammer' ? minimalistStyles : 
                  (theme === 'hammer-beige' ? hammerBeigeStyles : 
                  (theme === 'fresh-green' ? freshGreenStyles : 
                  (theme === 'dark' ? darkStyles : 
                  (theme === 'aurora' ? auroraStyles : null))))

    if (styles) {
        renderer.heading = ({ tokens, depth }: any) => {
            const text = renderer.parser.parseInline(tokens)
            const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            if (depth === 1) {
                return `<section style="${styles.h1.container}"><section style="${styles.h1.content}">${text}</section></section>`
            } else if (depth === 2) {
                return `<section style="${styles.h2.container}">
          <section style="${styles.h2.spanTop}"></section>
          <section style="${styles.h2.prefix}"></section>
          <section style="${styles.h2.content}">${text}</section>
          <section style="${styles.h2.suffix}"></section>
          <section style="${styles.h2.spanBottom}"></section>
        </section>`
            } else if (depth === 3) {
                return `<section style="${styles.h3.container}"><section style="${styles.h3.content}">${text}</section></section>`
            }
            return `<h${depth} id="${id}">${text}</h${depth}>`
        }
        renderer.paragraph = ({ tokens }: any) => {
            const text = renderer.parser.parseInline(tokens)
            // Check if it's an image
            if (text.startsWith('<img') || text.startsWith('<figure')) return `<p style="text-align: center; margin: 10px 0;">${text}</p>`
            return `<p style="${styles.p}">${text}</p>`
        }
        renderer.blockquote = ({ tokens }: any) => {
            const text = renderer.parser.parse(tokens)
            // Remove <p> tags from quote content if present, as we wrap it in our own p style
            const content = text.replace(/<p[^>]*>(.*?)<\/p>/g, '$1')
            return `<section style="${styles.blockquote.container}"><p style="${styles.blockquote.p}">${content}</p></section>`
        }
        renderer.list = ({ ordered, items }: any) => {
            const type = ordered ? 'ol' : 'ul'
            const style = ordered ? styles.ol : styles.ul
            const body = items.map((item: any) => renderer.listitem(item)).join('')
            return `<${type} style="${style}">${body}</${type}>`
        }
        renderer.listitem = ({ tokens }: any) => {
            const text = renderer.parser.parse(tokens)
            return `<li style="${styles.li.section}">${text}</li>`
        }
        renderer.strong = ({ tokens }: any) => {
            const text = renderer.parser.parseInline(tokens)
            // @ts-ignore
            const style = styles.strong || 'font-weight: bold;'
            return `<strong style="${style}">${text}</strong>`
        }
        renderer.link = ({ href, title, tokens }: any) => {
            const text = renderer.parser.parseInline(tokens)
            // @ts-ignore
            const style = styles.link || 'color: #3b82f6; text-decoration: underline;'
            return `<a href="${href}" title="${title || ''}" style="${style}" target="_blank">${text}</a>`
        }
        renderer.codespan = ({ text }: any) => {
            // @ts-ignore
            const style = styles.codespan || 'background-color: rgba(0, 0, 0, 0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace;'
            return `<code style="${style}">${text}</code>`
        }
        renderer.code = ({ text, lang }: any) => {
            // @ts-ignore
            const style = styles.code || 'background-color: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; font-family: monospace; display: block; margin: 15px 0; color: #1f2937;'
            return `<pre style="${style}"><code class="language-${lang || 'text'}">${text}</code></pre>`
        }
        renderer.image = ({ href, title, text }: any) => {
            // @ts-ignore
            const style = styles.image || 'max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;'
            return `<img src="${href}" alt="${text || ''}" title="${title || ''}" style="${style}" />`
        }
        renderer.table = ({ header, body }: any) => {
            // @ts-ignore
            const style = styles.table || 'width: 100%; border-collapse: collapse; margin: 20px 0;'
            return `<table style="${style}"><thead>${header}</thead><tbody>${body}</tbody></table>`
        }
        renderer.tablerow = ({ content }: any) => {
            return `<tr>${content}</tr>`
        }
        renderer.tablecell = ({ content, header, align }: any) => {
            const tag = header ? 'th' : 'td'
            // @ts-ignore
            let style = (header ? styles.th : styles.td) || 'border: 1px solid #ddd; padding: 8px;'
            if (align) {
                style += ` text-align: ${align};`
            }
            return `<${tag} style="${style}">${content}</${tag}>`
        }
        renderer.hr = () => {
             // @ts-ignore
            const style = styles.hr || 'border: 0; border-top: 1px solid #eee; margin: 20px 0;'
            return `<hr style="${style}" />`
        }
    }

    marked.setOptions({ renderer })
    let html = marked.parse(md) as string

    if (includeContainer) {
        if (theme === 'hammer-beige') {
            html = `<section style="background-color: rgb(251, 247, 238); padding: 20px;">${html}</section>`
        } else if (theme === 'hammer') {
            html = `<section style="background-color: #ffffff; padding: 20px;">${html}</section>`
        } else if (theme === 'fresh-green') {
            html = `<section style="background-color: #ffffff; padding: 20px;">${html}</section>`
        } else if (theme === 'dark') {
            html = `<section style="background-color: rgb(9, 9, 11); padding: 20px;">${html}</section>`
        } else if (theme === 'aurora') {
            html = `<section style="background-color: rgb(15, 23, 42); padding: 20px;">${html}</section>`
        }
    }

    return html
}
