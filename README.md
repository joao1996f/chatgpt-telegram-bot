# A Telegram bot for chatting with the OpenAI's ChatGPT
It uses the [chatgpt](https://github.com/transitive-bullshit/chatgpt-api) package to interact with the ChatGPT model and the [telegraf](https://github.com/telegraf/telegraf) package to interact with the Telegram API.

## Variables
Create a `.env` file with the following variables:
```
OPENAI_API_KEY=KEY
TELEGRAM_BOT_TOKEN=TOKEN
TELEGRAM_CHAT_ID_ADMIN=ID
TELEGRAM_ALLOWED_CHAT_IDS=ID1,ID2,ID3
```

## Local deploy

Use pnpm as the package manager:
```
pnpm install
```

Build:
```
pnpm build
```

Build and run:

```
pnpm run run
```

## Docker image

Create the image:
```
docker build -t chatgpt_bot:1.0.0 .
```

Run the container:
```
docker run -it -d \
  --name chatgpt_bot \
  --hostname chatgpt_bot \
  --restart unless-stopped \
  --env-file ./.env \
  chatgpt_bot:1.0.0
```
