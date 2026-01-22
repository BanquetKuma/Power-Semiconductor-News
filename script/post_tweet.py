#!/usr/bin/env python3
"""
Daily tweet posting script for Semiconductor News.

Posts a Gemini-generated highlight tweet and replies with the site link.

Required environment variables:
  GOOGLE_API_KEY    - Gemini API key
  X_API_KEY         - X API Key (Consumer Key)
  X_API_SECRET      - X API Secret (Consumer Secret)
  X_ACCESS_TOKEN    - X Access Token
  X_ACCESS_SECRET   - X Access Token Secret
"""

import os
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Constants
JST = timezone(timedelta(hours=9))
ROOT = Path(__file__).parent.parent
NEWS_FILE = ROOT / 'news' / 'latest.json'
TRENDS_FILE = ROOT / 'news' / 'trends.json'
SITE_URL = 'https://banquetkuma.github.io/Power-Semiconductor-News/'

def log(*args):
    print('[tweet]', *args, flush=True)


def load_news_data():
    """Load latest news and trends data."""
    news = None
    trends = None

    if NEWS_FILE.exists():
        with open(NEWS_FILE, 'r', encoding='utf-8') as f:
            news = json.load(f)

    if TRENDS_FILE.exists():
        with open(TRENDS_FILE, 'r', encoding='utf-8') as f:
            trends = json.load(f)

    return news, trends


def generate_tweet_with_gemini(news, trends):
    """Generate a catchy tweet using Gemini API."""
    api_key = os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        log('GOOGLE_API_KEY not set, using fallback tweet')
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-lite')

        # Build context from news and trends
        context_parts = []

        if trends and trends.get('meta_trends'):
            top_trends = trends['meta_trends'][:3]
            context_parts.append("【本日のトレンド】")
            for t in top_trends:
                context_parts.append(f"- {t['name']}: {t['summary']}")

        if news and news.get('highlight'):
            hl = news['highlight']
            context_parts.append(f"\n【注目】{hl['title']}: {hl['summary']}")

        if news and news.get('sections'):
            top_news = []
            for section in ['company', 'business', 'tools']:
                items = news['sections'].get(section, [])[:2]
                for item in items:
                    top_news.append(f"- {item['title']}")
            if top_news:
                context_parts.append("\n【主要ニュース】")
                context_parts.extend(top_news[:5])

        context = '\n'.join(context_parts)

        prompt = f"""あなたはX（Twitter）で半導体業界ニュースを発信するインフルエンサーです。
以下の情報から、バズりそうなツイートを1つ作成してください。

【条件】
- 日本語で140文字以内（厳守）
- 絵文字を2-3個使用して目を引く
- 投資家・エンジニアが興味を持つ内容
- 具体的な数字や企業名があれば含める
- ハッシュタグは2個まで（#半導体 #SiC など）
- 煽りすぎず、事実ベースで

【本日の情報】
{context}

【出力】
ツイート本文のみを出力してください。説明や前置きは不要です。
"""

        response = model.generate_content(prompt)
        tweet_text = response.text.strip()

        # Remove any markdown formatting
        tweet_text = tweet_text.replace('```', '').strip()

        # Ensure within 280 characters (X limit)
        if len(tweet_text) > 280:
            tweet_text = tweet_text[:277] + '...'

        log(f'Generated tweet ({len(tweet_text)} chars): {tweet_text}')
        return tweet_text

    except Exception as e:
        log(f'Gemini error: {e}')
        return None


def get_fallback_tweet(news, trends):
    """Generate a simple fallback tweet without LLM."""
    today = datetime.now(JST).strftime('%m/%d')

    if trends and trends.get('meta_trends'):
        top = trends['meta_trends'][0]
        return f"📊 {today} 半導体トレンド速報\n\n{top['name']}\n{top['summary'][:60]}...\n\n#半導体 #パワー半導体"

    if news and news.get('highlight'):
        hl = news['highlight']
        return f"🔔 {today} 半導体ニュース\n\n{hl['title']}\n\n#半導体"

    return f"📰 {today} 本日の半導体業界ニュースをまとめました\n\n#半導体 #SiC #パワー半導体"


def post_to_x(tweet_text, reply_text):
    """Post tweet and reply using X API."""
    import tweepy

    api_key = os.environ.get('X_API_KEY')
    api_secret = os.environ.get('X_API_SECRET')
    access_token = os.environ.get('X_ACCESS_TOKEN')
    access_secret = os.environ.get('X_ACCESS_SECRET')

    if not all([api_key, api_secret, access_token, access_secret]):
        log('X API credentials not fully configured')
        log('Would have posted:')
        log(f'  Main: {tweet_text}')
        log(f'  Reply: {reply_text}')
        return False

    try:
        # Initialize client
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )

        # Post main tweet
        main_response = client.create_tweet(text=tweet_text)
        main_tweet_id = main_response.data['id']
        log(f'Posted main tweet: {main_tweet_id}')

        # Post reply with link
        reply_response = client.create_tweet(
            text=reply_text,
            in_reply_to_tweet_id=main_tweet_id
        )
        reply_tweet_id = reply_response.data['id']
        log(f'Posted reply: {reply_tweet_id}')

        return True

    except Exception as e:
        log(f'X API error: {e}')
        return False


def main():
    log('Starting daily tweet posting...')

    # Load data
    news, trends = load_news_data()

    if not news and not trends:
        log('No news data available, skipping tweet')
        return

    # Generate tweet
    tweet_text = generate_tweet_with_gemini(news, trends)

    if not tweet_text:
        tweet_text = get_fallback_tweet(news, trends)

    # Prepare reply with link
    reply_text = f"""📰 詳細・全記事はこちら
{SITE_URL}

投資家向けトレンド分析も掲載中！
#半導体ニュース"""

    # Post to X
    success = post_to_x(tweet_text, reply_text)

    if success:
        log('Tweet posting completed successfully')
    else:
        log('Tweet posting skipped or failed')


if __name__ == '__main__':
    main()
