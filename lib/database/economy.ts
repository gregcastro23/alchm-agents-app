import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.RAILWAY_DATABASE_URL })

export async function debitInferenceCost(
  userId: string,
  costs: { spirit: number; essence: number; matter: number; substance: number }
) {
  const query = `
    WITH deduct AS (
      UPDATE token_balances
      SET 
        spirit_coins = spirit_coins - $2, 
        essence_coins = essence_coins - $3,
        matter_coins = matter_coins - $4, 
        substance_coins = substance_coins - $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 
        AND spirit_coins >= $2 
        AND essence_coins >= $3 
        AND matter_coins >= $4 
        AND substance_coins >= $5
      RETURNING user_id
    ),
    record_tx AS (
      INSERT INTO token_transactions (user_id, token_type, amount, source, description)
      SELECT $1, unnest(ARRAY['spirit', 'essence', 'matter', 'substance']), 
             unnest(ARRAY[-$2::numeric, -$3::numeric, -$4::numeric, -$5::numeric]),
             'local_inference', 'Local LLM Generation Deduction'
      FROM deduct -- Only inserts if deduction was successful
      WHERE unnest(ARRAY[$2::numeric, $3::numeric, $4::numeric, $5::numeric]) > 0
    )
    SELECT EXISTS(SELECT 1 FROM deduct) as success;
  `

  const result = await pool.query(query, [
    userId,
    costs.spirit,
    costs.essence,
    costs.matter,
    costs.substance,
  ])

  return result.rows[0].success // true if deducted, false if insufficient
}
