import { allMessageContent } from '@pc/components/Bubble/content'

import type { MessageContent } from '@pc/types/chat'
import type { ReactNode } from 'react'

export const renderMessageContent = (content: MessageContent[]): ReactNode => {
  if (!content || content.length === 0) {
    return null
  }

  return content.map((item, index) => {
    const renderContent = allMessageContent[item.type]

    return <div key={index}>{renderContent(item as never)}</div>
  })
}
