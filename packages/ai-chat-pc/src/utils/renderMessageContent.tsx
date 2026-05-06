import { allMessageContent } from '@pc/components/Bubble/mdRenderer'

import type { MessageContent } from '@pc/types/chat'
import type { ReactNode } from 'react'

// 把消息数组回放成 Bubble 能直接消费的 React 节点列表。
export const renderMessageContent = (content: MessageContent[]): ReactNode => {
  if (!content || content.length === 0) {
    return null
  }

  return content.map((item, index) => {
    const renderContent = allMessageContent[item.type]

    return <div key={index}>{renderContent(item as never)}</div>
  })
}
