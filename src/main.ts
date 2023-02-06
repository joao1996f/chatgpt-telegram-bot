import { ChatGPTAPI, ChatMessage } from 'chatgpt'
import { Telegraf } from 'telegraf'
import * as dotenv from 'dotenv'
dotenv.config()

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string)
const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY as string,
})

// session object
interface Session {
  conversationId: string
  id: string
}

// stores session data
let sessions = new Map<string, Session>()

// set bot commands
bot.telegram.setMyCommands([
  { command: 'gpt', description: 'Talk with ChatGPT' },
  { command: 'clear', description: 'Clear the session' },
  { command: 'chatid', description: 'Get your chat id' },
  { command: 'quit', description: 'Leave the group' },
])

// send a message to the admin chat id when starts
try {
  await bot.telegram.sendMessage(
    process.env.TELEGRAM_CHAT_ID_ADMIN as string,
    'ChatGPT Bot is running 🙂'
  )
} catch (error) {
  console.log('error', error)
}

// allow only these chat ids to use the bot
const allowedChatIds = process?.env?.TELEGRAM_ALLOWED_CHAT_IDS?.split(',') || []

// middleware to check if the chat id is allowed
bot.use(async (ctx, next) => {
  try {
    if (allowedChatIds.includes(ctx?.chat?.id?.toString() as string)) {
      return next()
    }
    ctx.reply('You are not allowed to use this bot.')
  } catch (error) {
    console.log('error', error)
  }
})

// start command
bot.start((ctx) => {
  try {
    let message = 'Please use the /gpt command to talk with ChatGPT.'
    ctx.reply(message)
  } catch (error) {
    console.log('error', error)
  }
})

// gpt command
bot.command('gpt', async (ctx) => {
  try {
    if (ctx.message.text === '/gpt') {
      ctx.reply('Please write your message after the /gpt command.')
      return
    }
    // remove the "/gpt " part of the message
    ctx.message.text = ctx.message.text.replace('/gpt ', '')
    let res: ChatMessage
    if (sessions.has(ctx.chat.id.toString())) {
      ctx.reply('Processing ⏳, please wait...', {
        reply_to_message_id: ctx.message.message_id,
      })
      res = await api.sendMessage(ctx.message.text, {
        conversationId: sessions.get(ctx.chat.id.toString())?.conversationId,
        parentMessageId: sessions.get(ctx.chat.id.toString())?.id,
      })
      // edit the message to remove the "Processing, please wait..." message
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message.message_id + 1,
        undefined,
        res.text
      )
    } else {
      ctx.reply('A new session was created!')
      ctx.reply('Processing ⏳, please wait...', {
        reply_to_message_id: ctx.message.message_id,
      })
      res = await api.sendMessage(ctx.message.text)
      // edit the message to remove the "Processing, please wait..." message
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.message.message_id + 2,
        undefined,
        res.text
      )
    }
    // store the session data
    sessions.set(ctx.chat.id.toString(), {
      conversationId: res.conversationId as string,
      id: res.id,
    })
  } catch (error) {
    ctx.reply('Error sending the message. Please try again.')
    console.log('error', error)
  }
})

// clear session command
bot.command('clear', async (ctx) => {
  try {
    sessions.delete(ctx.chat.id.toString())
    ctx.reply('Session cleared.')
  } catch (error) {
    console.log('error', error)
  }
})

// get chat id command
bot.command('chatid', async (ctx) => {
  try {
    ctx.reply(ctx.chat.id.toString())
  } catch (error) {
    ctx.reply('Error sending the message. Please try again.')
    console.log('error', error)
  }
})

// quit command
bot.command('quit', async (ctx) => {
  try {
    if (ctx.chat.type === 'private') {
      ctx.reply('This command is only available in groups.')
      return
    }
    ctx.reply('Bye!')
    ctx.leaveChat()
  } catch (error) {
    console.log('error', error)
  }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
