
import Comment from "../models/CommentModel.js"

import Movie from "../models/MovieModel.js";

// Hàm lấy danh sách comment theo movie slug
export const getCommentByMovieSlug = async (slug) => {
  try {
   
    const movie = await Movie.findOne({ slug });
    if (!movie) {
      throw new Error("Movie not found");
    }

    const comments = await Comment.find({ 
      movie: movie._id,
      status: "active" 
    })
    .populate({
      path: "user",
      select: "username"
    })
    .select("content user") 
    .lean();
    const result = comments.map(comment => ({
      userName: comment.user.username,
      content: comment.content,
      movieSlug: slug 
    }));

    return result;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

export const reviewSensePrompt = (comments) => {
  // Chuyển đổi comments thành chuỗi mô tả thay vì JSON
  const commentsText = comments.map(comment => 
    `- ${comment.userName}: "${comment.content}"`
  ).join('\n');

  return `
Bạn là một chuyên gia phân tích cảm xúc trong lĩnh vực điện ảnh.

Dựa trên các bình luận sau từ người dùng về một bộ phim, hãy viết **một đoạn phân tích ngắn bằng tiếng Việt** thể hiện **thái độ chung của khán giả đối với bộ phim đó**.

Yêu cầu:
- Xác định xem phản hồi chung là tích cực, tiêu cực hay trung lập.
- Phân tích ngắn gọn những lý do chính khiến khán giả thích hoặc không thích bộ phim (nếu có thể).
- Viết súc tích, tự nhiên, như một chuyên gia đánh giá phim tổng hợp phản hồi từ khán giả.

Chỉ trả về **một đoạn văn duy nhất**, không thêm bất kỳ định dạng đặc biệt nào.

Danh sách bình luận:
${commentsText}
`;
};

