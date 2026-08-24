# ねこじま (Neko Jima)

英検準2級の単語・熟語を、3Dの町を歩き回りながら覚える学習ゲームです。

このフォルダには、Vercelにそのままデプロイできる形（フロント＋サーバーレス関数）でまとまっています。

## 中身

```
nekojima/
├── index.html                       ← ゲーム本体（そのまま配信されます）
├── vercel.json                      ← Vercelの設定
├── package.json                     ← 関数が使うライブラリ（Supabase・Gemini SDK）
├── supabase-schema.sql              ← Supabaseで1回だけ実行するSQL
└── api/
    ├── generate-sentence.js         ← AIによる例文生成（Google Gemini APIを中継）
    ├── save-data.js                 ← セーブデータの保存
    └── load-data.js                 ← セーブデータの読み込み
```

## なぜNetlifyからVercelに変えたか

Netlifyの無料プランは2025〜2026年の料金体系変更で「月300クレジット、デプロイ1回15クレジット」という仕組みになり、月に約20回デプロイすると無料枠を使い切って止まってしまいます。開発中に何度も直しては公開し直す、という使い方と相性が悪いため、Vercelに切り替えました。VercelのHobby（無料）プランはデプロイ回数の制限が緩やかで、今回のような使い方に向いています。

Supabase（データベース）とGoogle Gemini（AI）はそのまま使えるので、作り直したのはNetlify部分（`/api`フォルダとその中身）だけです。

## セットアップ手順

### 1. Supabase（データベース）

すでに作成済みの場合はこの手順は飛ばしてください。

1. https://supabase.com で無料アカウントを作り、新しいプロジェクトを作成します。
2. 「SQL Editor」を開き、`supabase-schema.sql` の中身をコピー＆ペーストして実行します。
3. 「Project Settings」→「API」から、**Project URL** と **service_role キー**（`anon`キーではない方）をメモしておきます。

### 2. Google Gemini APIキー

すでに発行済みの場合はこの手順は飛ばしてください。

1. https://aistudio.google.com/apikey を開き、Googleアカウントでログインします。
2. 「Create API key」でキーを発行し、コピーしておきます（クレジットカード登録は不要です）。

### 3. GitHubにアップロードする

このフォルダを丸ごと、既存の `nekojima` リポジトリに上書きアップロードしてください（前回Netlify用にアップロードしたときと同じ手順です。GitHubの画面から `Add file` → `Upload files` で、このフォルダの中身をドラッグ＆ドロップし、Commit changesを押します）。

### 4. Vercelでデプロイする

1. https://vercel.com でアカウントを作ります（「Continue with GitHub」が一番簡単です）。
2. 「Add New...」→「Project」を選びます。
3. `nekojima` リポジトリを選び、「Import」します。
4. フレームワークの設定は自動判定されます（「Other」のままで問題ありません）。特に変更せず、そのまま「Deploy」を押します。
5. デプロイが終わったら、プロジェクトの「Settings」→「Environment Variables」で、次の3つを追加します。

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | Google AI Studioで発行したAPIキー |
   | `SUPABASE_URL` | SupabaseのProject URL |
   | `SUPABASE_SERVICE_KEY` | Supabaseの service_role キー |

6. 環境変数を追加したら、「Deployments」タブから最新のデプロイを開き、右上の「...」メニューから「Redeploy」を選んで再デプロイしてください（環境変数は再デプロイ後から反映されます）。

### 5. 動作確認

1. 発行されたURL（例: `https://nekojima-xxxx.vercel.app`）を開きます。
2. 「あたらしくはじめる」を押すと、セーブコードが発行されます。
3. NPCに話しかけて、まだ出会っていない単語で「ことばを考え中…」のあと、実際に英文が出てくれば成功です。

## 費用について

- **Vercel**: Hobby（無料）プランで十分動きます。個人・非商用利用の範囲であれば無料です。
- **Supabase**: 無料枠（500MBまで）で十分足ります。
- **Google Gemini API**: 無料枠の範囲で運用できます。クレジットカード登録も不要です。

## セーブデータの仕組み

各プレイヤーは「セーブコード」（例: `ねこ-1234`）で識別されます。ログイン・パスワードのような仕組みは作っていないので、コードを知っている人なら誰でもそのセーブを読み書きできます。兄弟・姉妹で別々に遊ばせたい場合は、それぞれ「あたらしくはじめる」で別のコードを作ってください。

## 既知の制限

- 「めいろねこ島」はまだ未実装です（壁の当たり判定という別の仕組みが必要なため）。
- ミニゲーム（ねずみインベーダー・ねこロードランナー）も未実装のプレースホルダーです。
- セーブコードにパスワード等の保護はありません。学習用の小規模利用を想定した簡易的な仕組みです。
- Vercel Hobbyプランは「個人・非商用利用」向けの規約です。家庭学習用のこのゲームには問題なく当てはまります。
