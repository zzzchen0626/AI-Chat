import { CopyOutlined, DownOutlined } from '@ant-design/icons'
import { Attachments } from '@ant-design/x'
import { Image } from 'antd'
import hljs from 'highlight.js'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import type { FileContent, ImageContent, MessageContent, TextContent } from '@pc/types/chat'
import type { ReactElement, ReactNode } from 'react'
import type { Components } from 'react-markdown'

// 内容处理器映射：把消息内容里的不同类型，分发给对应的渲染逻辑。
type ContentHandlers = {
  [K in MessageContent['type']]: (data: Extract<MessageContent, { type: K }>) => ReactElement
}

// 图片消息：直接用 antd Image 展示，保留预览能力。
const imageContent = (data: ImageContent): ReactElement => {
  const { content } = data
  return <Image src={content} />
}

// 文件消息：交给附件卡片展示下载/预览信息。
const fileContent = (data: FileContent): ReactElement => {
  const { content } = data
  return <Attachments.FileCard item={content} />
}

// 只允许安全协议、站点相对路径和 data URI，避免 Markdown 注入异常链接。
const isSafeUrl = (url: string) =>
  /^(https?:)?\/\//i.test(url) || url.startsWith('/') || url.startsWith('data:')

// 把代码复制到剪贴板，失败时静默处理，避免影响阅读体验。
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore clipboard errors
  }
}

// 代码块组件负责“语言识别、语法高亮、折叠、复制”四件事。
const CodeBlock = ({ className, codeText }: { className?: string; codeText: string }) => {
  // 折叠状态只控制代码主体，保留头部便于再次展开。
  const [collapsed, setCollapsed] = useState(false)
  //正则从 className 里提取语言名
  const languageMatch = /language-(\w+)/.exec(className || '')
  const language = languageMatch?.[1] || 'text'
  // “语言合法性检查”：highlight.js 是否支持
  const normalizedLanguage = hljs.getLanguage(language) ? language : 'text'
  //显示在代码块头部的语言标签。
  const displayLabel = normalizedLanguage === 'text' ? 'text' : normalizedLanguage

  if (!codeText) {
    return null
  }

  // 先用 highlight.js 生成高亮后的 HTML，再交给 code 标签渲染。
  const highlighted = hljs.highlight(codeText, { language: normalizedLanguage }).value

  return (
    <div className={`md-codeblock ${collapsed ? 'is-collapsed' : ''}`}>
      {/* 代码块头部：左侧折叠按钮，中间语言标签，右侧复制按钮。 */}
      <div className="md-codeblock__header">
        <button
          type="button"
          className="md-codeblock__toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? '展开代码块' : '收起代码块'}>
          <DownOutlined className="md-codeblock__toggle-icon" />
        </button>
        <span className="md-codeblock__lang">{displayLabel}</span>
        <button
          type="button"
          className="md-codeblock__copy"
          onClick={() => copyToClipboard(codeText)}
          aria-label={`复制 ${displayLabel} 代码`}>
          <CopyOutlined />
        </button>
      </div>
      {/* 收起时隐藏代码内容，只保留头部占位。 */}
      {!collapsed ? (
        <div className="md-codeblock__body">
          <pre className="md-codeblock__pre">
            <code
              className={`md-codeblock__code hljs language-${normalizedLanguage}`}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      ) : null}
    </div>
  )
}

// Markdown 渲染入口：把 markdown AST 映射成我们定制的 React 节点。
const MarkdownText = ({ content }: { content: string }) => {
  const components = useMemo<Components>(
    () => ({
      // 区分行内代码和代码块，避免把普通 `code` 误渲染成大块代码框。
      code({ className, children }) {
        if (className?.includes('language-')) {
          // 判断依据：是否有语言
          return <code>{children}</code>
        }

        return <code className="md-inline-code">{children}</code>
      },
      // pre 里包着真正的代码块内容，所以把它交给 CodeBlock 统一处理。
      pre({ children }) {
        /* 告诉 TS：这个 children 我认为是一个 React 元素，你按这个类型看它。 */
        const codeElement = children as ReactElement<{ className?: string; children?: ReactNode }>
        // 转成字符串 去掉末尾的换行符
        const codeText = String(codeElement?.props?.children ?? '').replace(/\n$/, '')
        return <CodeBlock className={codeElement?.props?.className} codeText={codeText} />
      },
      // Markdown 图片渲染成 antd 的 Image
      img({ src = '', alt = '' }) {
        const safeSrc = isSafeUrl(src) ? src : ''
        return <Image className="md-image" src={safeSrc} alt={alt} preview={Boolean(safeSrc)} />
      },
      // 链接统一做安全校验，并在新标签页打开。
      a({ href = '', children }) {
        const safeHref = isSafeUrl(href) ? href : '#'
        // 链接安全化处理 ; 跳转策略
        return (
          <a href={safeHref} target="_blank" rel="noreferrer noopener">
            {children}
          </a>
        )
      },
      // 段落统一包裹成 div，方便做样式控制。
      p({ children }) {
        return <div className="md-paragraph">{children}</div>
      },
      // 表格外层加滚动容器，避免小屏幕下表格撑爆布局。
      table({ children }) {
        return (
          <div className="md-table-wrap">
            <table>{children}</table>
          </div>
        )
      }
    }),
    []
  )

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

const textContent = (data: TextContent): ReactElement => {
  return <MarkdownText content={data.content} />
}

export const allMessageContent: ContentHandlers = {
  image: imageContent,
  file: fileContent,
  text: textContent
}
