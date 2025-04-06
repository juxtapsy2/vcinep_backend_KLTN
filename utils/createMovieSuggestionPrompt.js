export const createMovieSuggestionPrompt = (movies, userPrompt) => {
  // Tạo context từ dữ liệu phim
  const movieContext = movies
    .map(
      (movie) =>
        `- ${movie.title} (${movie.year}): ${movie.genre}, Rating: ${movie.rating}, ${movie.description}`
    )
    .join("\n");

  return `
    Bạn là một chuyên gia về phim và có kiến thức sâu rộng về điện ảnh.
    
    Dựa trên danh sách phim sau đây:
    ${movieContext}
  
    Hãy gợi ý tối đa 5 bộ phim phù hợp nhất với yêu cầu của người dùng:
    "${userPrompt}"
  
    Quy tắc gợi ý:
    1. Chỉ gợi ý những phim có trong danh sách đã cho
    2. Ưu tiên những phim có rating cao và phù hợp với yêu cầu người dùng
    3. Đưa ra lý do cụ thể tại sao gợi ý phim đó
    4. Nếu không tìm thấy phim phù hợp, trả về mảng trống
  
    Trả về kết quả theo định dạng JSON với cấu trúc:
    {
      "suggestions": [
        {
          "title": "Tên phim",
          "year": năm,
          "genre": "Thể loại",
          "rating": điểm đánh giá,
          "reason": "Lý do gợi ý phim này"
        }
      ]
    }
  
    Chỉ trả về dữ liệu JSON, không thêm bất kỳ text nào khác.`;
};
