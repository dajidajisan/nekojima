# ねこじま (Neko Jima)

英検準2級の単語・熟語を、3Dの町を歩き回りながら覚える学習ゲームです。

このフォルダには、Netlifyにそのままデプロイできる形（フロント＋サーバーレス関数）でまとまっています。

## 中身

```
nekojima/
├── index.html                       ← ゲーム本体（そのまま配信されます）
├── netlify.toml                     ← Netlifyの設定
├── package.json                     ← 関数が使うライブラリ（Supabase用）
├── supabase-schema.sql              ← Supabaseで1回だけ実行するSQL
└── netlify/functions/
    ├── generate-sentence.js         ← AIによる例文生成（Google Gemini APIを中継）
    ├── save-data.js                 ← セーブデータの保存
    └── load-data.js                 ← セーブデータの読み込み
```

## セットアップ手順

### 1. Supabase（データベース）を用意する

1. https://supabase.com で無料アカウントを作り、新しいプロジェクトを作成します。
2. プロジェクト内の「SQL Editor」を開き、`supabase-schema.sql` の中身をコピー＆ペーストして実行します。
   これで `player_data` というテーブルが1つ作られます。
3. 「Project Settings」→「API」から、次の2つをメモしておきます。
   - **Project URL**（例: `https://xxxxx.supabase.co`）
   - **service_role キー**（`anon` キーではなく、必ず `service_role` の方です。これはサーバー側だけで使う秘密の鍵なので、絶対にフロント側のコードには書かないでください）

### 2. Google Gemini APIキーを無料で発行する

1. https://aistudio.google.com/apikey を開き、お持ちのGoogleアカウントでログインします
2. 「Create API key」のようなボタンを押します
3. 表示されたキー（`AIza` から始まる文字列）をコピーしてメモしておきます

**クレジットカードの登録は不要です。** Googleの無料枠（1日あたり数百〜1000回程度のリクエストまで無料）の範囲で、今回の「新しい単語に出会ったときだけ生成する」という使い方には十分すぎるほどです。

### 3. GitHubにアップロードする

このフォルダを丸ごと、新しいGitHubリポジトリにpushしてください。

```bash
cd nekojima
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/nekojima.git
git push -u origin main
```

### 4. Netlifyでデプロイする

1. https://netlify.com でアカウントを作り、「Add new site」→「Import an existing project」
2. 先ほどのGitHubリポジトリを選択します。
3. ビルド設定はそのままで大丈夫です（`netlify.toml` が自動で読み込まれます）。
4. デプロイ後、「Site configuration」→「Environment variables」で、次の3つを追加してください。

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | Google AI Studioで発行したAPIキー |
   | `SUPABASE_URL` | SupabaseのProject URL |
   | `SUPABASE_SERVICE_KEY` | Supabaseの service_role キー |

5. 環境変数を追加したら、「Deploys」タブから再デプロイ（Trigger deploy）してください。環境変数は再デプロイ後から反映されます。

### 5. 動作確認

1. 発行されたURL（例: `https://nekojima-xxxx.netlify.app`）を開きます。
2. 最初に「あたらしくはじめる」を押すと、セーブコード（例: `ねこ-1234`）が表示されます。これをメモしておけば、別の端末でも同じコードを入れて続きから遊べます。
3. NPCに話しかけて、まだ出会っていない単語で「ことばを考え中…」の表示が出れば、AI生成が正しく動いています。

## 費用について

- **Netlify**: 無料枠で十分動きます（個人利用の範囲なら）。
- **Supabase**: 無料枠（500MBまで）で十分足ります。
- **Google Gemini API**: 無料枠の範囲で運用できます。クレジットカード登録も不要です。すでに生成済みの単語はキャッシュされるので、同じ単語で何度もAPIが呼ばれることはありません。

## セーブデータの仕組み

各プレイヤーは「セーブコード」（例: `ねこ-1234`）で識別されます。ログイン・パスワードのような仕組みは作っていないので、コードを知っている人なら誰でもそのセーブを読み書きできます。兄弟・姉妹で別々に遊ばせたい場合は、それぞれ「あたらしくはじめる」で別のコードを作ってください。

## 既知の制限

- 「めいろねこ島」はまだ未実装です（壁の当たり判定という別の仕組みが必要なため）。
- ミニゲーム（ねずみインベーダー・ねこロードランナー）も未実装のプレースホルダーです。
- セーブコードにパスワード等の保護はありません。学習用の小規模利用を想定した簡易的な仕組みです。
