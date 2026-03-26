import { pool } from "../../config/db";
import { mockReviews } from "../../data/mock-store";

type ReviewRow = {
  id: string;
  user_name: string;
  comment: string | null;
  rating: number;
};

export async function listReviews() {
  try {
    const result = await pool.query<ReviewRow>("SELECT * FROM app_get_reviews($1)", [6]);

    if (result.rows.length > 0) {
      return result.rows.map((row) => ({
        id: row.id,
        user: row.user_name,
        comment: row.comment ?? "Sin comentario.",
        score: Number(row.rating)
      }));
    }

    return mockReviews;
  } catch {
    return mockReviews;
  }
}
