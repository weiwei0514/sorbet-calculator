# Sorbet 配方自動計算器

根據水果比例、目標總固形物、膠體比例與其他糖類比例，自動反推完整的 Sorbet 配方（水果重量、水分/糖分/固形物拆解、需補充的砂糖與水）。

## 技術棧

Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase（食材資料庫）。

## 開始使用

1. 安裝套件：`npm install`
2. 建立一個 Supabase 專案，於 SQL Editor 執行 `supabase/schema.sql`（會建立 `ingredients` 資料表並帶入常見水果/糖類的種子資料）
3. 把該 Supabase 專案的 URL 與 anon key 填入 `.env.local`：
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ANTHROPIC_API_KEY=...   # 「已儲存配方」頁的 AI 風味分析會用到
   ```
4. 依序執行 `supabase/migrations/` 內的 SQL（在 Supabase SQL Editor）。其中 `0005_recipe_ai_analysis.sql` 為 AI 風味分析的快取欄位。
5. `npm run dev` 啟動開發伺服器

在完成上述設定前，首頁會顯示提示訊息，說明尚需設定 Supabase。

## 專案結構

- `src/lib/calculator/` — 純計算引擎（types / config / validate / engine），與 UI 完全解耦，可獨立測試
- `src/lib/ingredients/` — 食材資料庫的查詢與寫入（透過 Supabase）
- `src/lib/aiAnalysis/` — AI 風味分析的 prompt 組裝與輸出 schema
- `src/app/api/analyze-recipe/` — 呼叫 Claude（`claude-opus-5`）分析已儲存配方的 route handler，結果快取回 `saved_recipes.ai_analysis`
- `src/lib/supabase/` — Supabase client（browser）與 server client
- `src/components/calculator/` — 配方設定、自動計算配方、配方分析、錯誤訊息等 UI
- `src/components/ingredients/` — 食材資料庫的新增/修改/刪除/搜尋 UI
- `supabase/schema.sql` — 資料表結構與種子資料，於 Supabase SQL Editor 執行

## 測試

`npm run test` 執行計算引擎的單元測試，涵蓋規格書中的試算範例（1000g 總重、40% 草莓、30% 目標固形物、3% 葡萄糖粉、0.5% 膠體）以及各種無法成立配方時的錯誤訊息。
