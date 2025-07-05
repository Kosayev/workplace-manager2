# 申し送り事項（Handovers）テーブルの更新手順

## 概要
申し送り事項にタスク管理システムと同様の高度なステータス管理とコメント機能を追加します。

## 必要な変更

### 1. 新しい列の追加
handoversテーブルに以下の列を追加します：

- `status_comment` - ステータスに関するコメント（進捗状況の詳細）
- `assigned_to` - 担当者（誰が対応するか）
- `last_updated` - 最終更新日時

### 2. ステータス値の統一
既存のstatusを以下の値に統一します：
- `pending` → `pending` （未対応）
- `in-progress` → `in_progress` （対応中）
- `completed` → `completed` （対応済）

## データベース更新手順

### ステップ1: Supabaseダッシュボードにアクセス
1. https://supabase.com にアクセス
2. プロジェクトにログイン
3. 左メニューから「SQL Editor」を選択

### ステップ2: 新しいクエリを作成
「New query」をクリックして新しいクエリを作成します。

### ステップ3: 以下のSQLを実行

```sql
-- 申し送り事項テーブルに新しい列を追加
ALTER TABLE handovers 
ADD COLUMN status_comment TEXT DEFAULT NULL,
ADD COLUMN assigned_to TEXT DEFAULT NULL,
ADD COLUMN last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ステータス値を統一（必要に応じて）
UPDATE handovers 
SET status = 'pending' 
WHERE status = 'pending';

UPDATE handovers 
SET status = 'in_progress' 
WHERE status = 'in-progress';

UPDATE handovers 
SET status = 'completed' 
WHERE status = 'completed';

-- 最終更新日時の自動更新トリガーを作成
CREATE OR REPLACE FUNCTION update_handover_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handover_last_updated_trigger
    BEFORE UPDATE ON handovers
    FOR EACH ROW
    EXECUTE FUNCTION update_handover_last_updated();
```

### ステップ4: 実行確認
以下のクエリで更新が成功したか確認：

```sql
-- テーブル構造の確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'handovers'
ORDER BY ordinal_position;

-- サンプルデータの確認
SELECT id, title, status, status_comment, assigned_to, last_updated 
FROM handovers 
LIMIT 5;
```

## 注意事項

1. **バックアップ**: データベース更新前に必ずバックアップを取得してください
2. **テスト**: 本番環境での実行前にテスト環境で動作確認を行ってください
3. **エラー処理**: SQL実行中にエラーが発生した場合は、操作を中止してください

## 期待される結果

### 更新後のテーブル構造
```
handovers テーブル:
- id (integer, primary key)
- title (text)
- department (text)
- description (text)
- priority (text)
- timestamp (timestamp)
- status (text: 'pending', 'in_progress', 'completed')
- file_url (text)
- status_comment (text) ← 新規追加
- assigned_to (text) ← 新規追加
- last_updated (timestamp) ← 新規追加
```

### 新機能
- ステータス変更時のコメント機能
- 担当者の指定
- 最終更新日時の自動追跡
- 進捗状況の詳細な記録

## トラブルシューティング

### よくあるエラー
1. **権限エラー**: 管理者権限でログインしているか確認
2. **テーブル不存在**: handoversテーブルが存在するか確認
3. **列名重複**: 既に同名の列が存在しないか確認

### 問題解決方法
- エラーメッセージを確認してください
- 必要に応じて列の削除から再実行してください
- サポートが必要な場合は、エラーメッセージと共に相談してください