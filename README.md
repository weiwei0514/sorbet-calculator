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
4. 依序執行 `supabase/migrations/` 內的 SQL（在 Supabase SQL Editor）。
   - `0005_recipe_ai_analysis.sql` — AI 風味分析與追問對話的快取欄位
   - `0006_saved_recipe_note.sql` — 儲存配方的「備註」欄位（**未執行的話，儲存配方會失敗**）
   - `0007_saved_recipe_kind.sql` — `kind`（sorbet / gelato），讓已儲存配方頁分頁（**未執行的話，儲存 Gelato 配方會失敗**）
5. `npm run dev` 啟動開發伺服器

在完成上述設定前，首頁會顯示提示訊息，說明尚需設定 Supabase。

## 專案結構

- `src/lib/calculator/` — Sorbet 純計算引擎（types / config / validate / engine），與 UI 完全解耦，可獨立測試
- `src/lib/gelato/` — Gelato 配方平衡引擎（確定性流程，非最佳化）：
  STEP 0 固定驗收範圍 → STEP 1 目標（總重、Fat%、MSNF%）+ 固定加入（蔗糖/膠體/蛋黃%）
  → STEP 2 風味／固定食材（固定重量或 %）→ 扣除所有固定食材的重量與成分
  → `solve3x3.ts` 三元一次方程式求三個主要基底食材 X/Y/Z
  → STEP 3 重新計算水份／糖分／其他固形物／總固形物比例，並算最終 POD、PAC 與建議儲存溫度。
  負重量或無唯一解時回報錯誤，不自行修改使用者目標。純函式，`__tests__/gelato.test.ts` 覆蓋
- 計算機頁（`/`）上方可切換 SORBET / GELATO（`CalculatorModeSwitch`），選擇記在 localStorage
- 兩種配方都能「儲存配方」；已儲存配方頁（`/saved`）以 SORBET / GELATO 分頁顯示
  （`saved_recipes.kind` 區分；Gelato 只能在算出可行配方後儲存，AI 風味分析目前仍為 Sorbet 專用）
- `src/lib/ingredients/` — 食材資料庫的查詢與寫入（透過 Supabase）
- `src/lib/aiAnalysis/` — AI 風味分析的 prompt 組裝與輸出 schema
- `src/app/api/analyze-recipe/` — 呼叫 Claude（`claude-opus-5`）分析已儲存配方的 route handler，結果快取回 `saved_recipes.ai_analysis`
- `src/lib/supabase/` — Supabase client（browser）與 server client
- `src/components/calculator/` — 配方設定、自動計算配方、配方分析、錯誤訊息等 UI
- `src/components/ingredients/` — 食材資料庫的新增/修改/刪除/搜尋 UI
- `supabase/schema.sql` — 資料表結構與種子資料，於 Supabase SQL Editor 執行

## 測試

`npm run test` 執行計算引擎的單元測試，涵蓋規格書中的試算範例（1000g 總重、40% 草莓、30% 目標固形物、3% 葡萄糖粉、0.5% 膠體）以及各種無法成立配方時的錯誤訊息。
