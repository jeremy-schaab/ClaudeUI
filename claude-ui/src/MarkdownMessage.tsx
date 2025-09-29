import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import './MarkdownMessage.css'

interface MarkdownMessageProps {
  content: string
}

function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        code(props: any) {
          const {inline, className, children} = props
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''

          return !inline && language ? (
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code>
              {children}
            </code>
          )
        },
        h1: (props: any) => <h1>{props.children}</h1>,
        h2: (props: any) => <h2>{props.children}</h2>,
        h3: (props: any) => <h3>{props.children}</h3>,
        p: (props: any) => <p>{props.children}</p>,
        ul: (props: any) => <ul>{props.children}</ul>,
        ol: (props: any) => <ol>{props.children}</ol>,
        li: (props: any) => <li>{props.children}</li>,
        blockquote: (props: any) => <blockquote>{props.children}</blockquote>,
        a: (props: any) => (
          <a href={props.href} target="_blank" rel="noopener noreferrer">
            {props.children}
          </a>
        ),
        table: (props: any) => <table>{props.children}</table>,
        thead: (props: any) => <thead>{props.children}</thead>,
        tbody: (props: any) => <tbody>{props.children}</tbody>,
        tr: (props: any) => <tr>{props.children}</tr>,
        th: (props: any) => <th>{props.children}</th>,
        td: (props: any) => <td>{props.children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  )
}

export default MarkdownMessage