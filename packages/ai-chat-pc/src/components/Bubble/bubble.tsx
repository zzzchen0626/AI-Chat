import { ArrowDownOutlined, UserOutlined } from '@ant-design/icons'
import { Bubble } from '@ant-design/x'
import { Button } from 'antd'
import { useCallback, useEffect, useReducer, useRef } from 'react'

import { useChatStore, useConversationStore } from '@pc/store'

import { allMessageContent } from './content'

import type { BubbleListRef } from '@ant-design/x/es/bubble/BubbleList'
import type { MessageContent } from '@pc/types/chat'
import type { GetProp } from 'antd'

import './bubble.css' // 添加CSS导入
import 'highlight.js/styles/github.css'

// 判断是否进入底部的距离
const SCROLL_BOTTOM_DISTANCE = 80

export const ChatBubble = () => {
  // 消息列表Ref
  const listRef = useRef<BubbleListRef>(null)
  // 节流定时器
  const throttleTimerRef = useRef<number | null>(null)
  // 滚动跟随开关
  const autoScrollRef = useRef(true)
  // 用于在 ref 更新后触发视图刷新
  const [, forceUpdate] = useReducer((value: number) => value + 1, 0)
  const { messages } = useChatStore()
  const { selectedId } = useConversationStore()

  // 不同文本样式渲染
  const rolesAsObject: GetProp<typeof Bubble.List, 'roles'> = {
    system: {
      placement: 'start',
      avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
      variant: 'borderless',
      style: {
        maxWidth: '100%'
      }
    },
    user: {
      placement: 'end',
      avatar: { icon: <UserOutlined />, style: { background: '#87d068' } }
    },
    file: {
      placement: 'end',
      variant: 'borderless'
    },
    image: {
      placement: 'end',
      variant: 'borderless'
    }
  }

  const chatMessage = selectedId ? messages.get(selectedId) : []

  // 滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    listRef.current?.scrollTo({
      offset: Number.MAX_SAFE_INTEGER,
      behavior,
      block: 'end'
    })
  }, [])

  // 是否接近底部
  const isNearBottom = useCallback((element: HTMLDivElement) => {
    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight
    return distanceToBottom <= SCROLL_BOTTOM_DISTANCE
  }, [])

  useEffect(() => {
    const element = listRef.current?.nativeElement
    if (!element) {
      return
    }
    const handleScroll = () => {
      if (throttleTimerRef.current !== null) {
        return
      }
      // 滚动事件的节流；每次检测是否接近底部，恢复自动跟随
      throttleTimerRef.current = window.setTimeout(() => {
        throttleTimerRef.current = null
        const nearBottom = isNearBottom(element)

        if (autoScrollRef.current !== nearBottom) {
          autoScrollRef.current = nearBottom
          forceUpdate()
          console.log(autoScrollRef.current, 'autoScrollRef.current')
        }
      }, 100)
    }
    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      // 卸载事件 & 定时器
      element.removeEventListener('scroll', handleScroll)

      if (throttleTimerRef.current !== null) {
        window.clearTimeout(throttleTimerRef.current)
        throttleTimerRef.current = null
      }
    }
  }, [isNearBottom, selectedId])

  // 渲染消息内容
  const renderMessageContent = (content: MessageContent[]) => {
    if (!content || content.length === 0) {
      return null
    }

    return content.map((item, index) => {
      return (
        <div key={index}>
          {/*  eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
          {allMessageContent[item.type as keyof typeof allMessageContent](item as any)}
        </div>
      )
    })
  }

  return (
    <div className="chat-bubble-wrapper">
      {!autoScrollRef.current && (
        <Button
          className="chat-bubble-scroll-bottom"
          shape="circle"
          style={{
            background: '#fff',
            color: '#000',
            borderColor: '#e5e5e5'
          }}
          onClick={() => scrollToBottom('smooth')}>
          <ArrowDownOutlined />
        </Button>
      )}
      <Bubble.List
        ref={listRef}
        className="chat-bubble-list"
        autoScroll={autoScrollRef.current}
        style={{
          paddingInline: 16,
          height: '100%',
          width: '50vw',
          overflowY: 'auto', // 确保可以滚动但滚动条被CSS隐藏
          paddingBottom: '25%'
        }}
        roles={rolesAsObject}
        items={chatMessage?.map((message, index) => ({
          key: index,
          role: message.role,
          content: renderMessageContent(message.content)
        }))}
      />
    </div>
  )
}
