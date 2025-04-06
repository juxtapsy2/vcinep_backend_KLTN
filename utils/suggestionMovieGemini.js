import Movie from "../models/MovieModel.js";
export const getMoviesWithReasons = async (input) => {
  try {
    // Kiểm tra nếu input rỗng
    if (!input) return [];

    // Chuyển đổi input string thành mảng các object {slug, reason}
    const movieRequests = input.split(",").map((item) => {
      const [slug, reason] = item.split(":");
      return {
        slug: slug?.trim().replace("[", "").replace("]", ""),
        reason: reason?.trim().replace("[", "").replace("]", ""),
      };
    });

    // Lấy tất cả các slug để query một lần
    const slugs = movieRequests.map((item) => item.slug);

    // Query tất cả phim có slug trong danh sách
    const movies = await Movie.find({
      slug: { $in: slugs },
      status: "active",
    });

    // Map kết quả với reason tương ứng
    const result = movies.map((movie) => {
      const matchingRequest = movieRequests.find(
        (req) => req.slug === movie.slug
      );
      return {
        id: movie._id,
        title: movie.title,
        slug: movie.slug,
        coverImage: movie.coverImage,
        year: movie.startDate.getFullYear(),
        genre: movie.genre,
        trailer: movie.trailer,
        rating: movie.rating,
        description: movie.description,
        classification: movie.classification,
        duration: movie.duration,
        director: movie.director,
        actors: movie.actors,
        language: movie.language,
        format: movie.format,
        reason: matchingRequest ? matchingRequest.reason : "",
      };
    });

    return result;
  } catch (error) {
    console.error("Error fetching movies with reasons:", error);
    throw error;
  }
};
// Hàm lấy danh sách phim từ database
export const getActiveMovies = async () => {
  try {
    const currentDate = new Date();

    const movies = await Movie.find({
      status: "active",
      endDate: { $gte: currentDate },
    });

    // Chuyển đổi dữ liệu để phù hợp với format prompt
    return movies.map((movie) => ({
      id: movie._id,
      title: movie.title,
      slug: movie.slug,
      coverImage: movie.coverImage,
      year: movie.startDate.getFullYear(),
      genre: movie.genre.join(", "),
      rating: movie.rating,
      description: movie.description,
      classification: movie.classification,
      duration: movie.duration,
      director: movie.director,
      actors: movie.actors.join(", "),
      language: movie.language,
      format: movie.format,
    }));
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
};
export const cleanRequest = (request) => {
  return (
    request
      // Xóa HTML tags
      .replace(/<[^>]*>/g, "")

      // Xóa xuống dòng, tab
      .replace(/[\n\r\t]/g, " ")

      // Xóa //, \\, /, \
      .replace(/(\/\/|\\\\|\/|\\)/g, "")

      // Giữ lại: chữ cái (kể cả tiếng Việt), số, khoảng trắng, -, :, [, ], ,
      .replace(/[^\p{L}\p{N}\s\-\[\],:]/gu, "")

      // Chuẩn hóa khoảng trắng
      .replace(/\s+/g, " ")

      // Định dạng lại khoảng trắng quanh các ký tự đặc biệt
      .replace(/\[\s+/g, "[")
      .replace(/\s+\]/g, "]")
      .replace(/\s*:\s*/g, ":")
      .replace(/\s*-\s*/g, "-")
      .replace(/\s*,\s*/g, ", ")

      // Xóa khoảng trắng đầu cuối
      .trim()
  );
};
export const createMovieSuggestionPrompt = (movies, userPrompt) => {
  const movieContext = movies
    .map(
      (movie) => `
{
  "id": "${movie.id}",
  "slug": "${movie.slug}",
  "title": "${movie.title}", 
  "coverImage": "${movie.coverImage}",
  "trailer": "${movie.trailer}",
  "year": ${movie.year},
  "genre": "${movie.genre}",
  "director": "${movie.director}",
  "actors": "${movie.actors}",
  "classification": "${movie.classification}",
  "duration": ${movie.duration},
  "language": "${movie.language}", 
  "format": "${movie.format}",
  "rating": ${movie.rating},
  "description": "${movie.description}"
}`
    )
    .join(",\n");

  return `Bạn là chuyên gia phim. Dựa trên danh sách phim và yêu cầu của người dùng, hãy gợi ý những phim phù hợp nhất.

Danh sách phim: [${movieContext}]

Yêu cầu tìm phim: "${userPrompt}"

Quy tắc:
1. Chỉ gợi ý phim có trong danh sách
2. Ưu tiên phim:
   - Có rating cao
   - Phù hợp nhất với yêu cầu
   - Nội dung và thể loại tương đồng
3. Tối đa 5 gợi ý
4. Trả về chuỗi rỗng nếu không có phim phù hợp

Chỉ trả về một chuỗi duy nhất theo format: [slug1:lý do 1], [slug2:lý do 2]
Trong đó:
- slug: định danh của phim
- lý do: giải thích ngắn gọn bằng tiếng Việt tại sao phim này phù hợp, lý do phim đáp ứng yêu cầu người dùng, mô tả ngắn về phim
 

Ví dụ: 
[phim-tinh-cam-1-Phim có rating cao 9/10:nội dung tình cảm lãng mạn phù hợp yêu cầu], [phim-tinh-cam-2:Thể loại rom-com nhẹ nhàng, diễn xuất tự nhiên]

Không thêm bất kỳ text hay format nào khác, chỉ trả về chuỗi chứa các cặp [slug:lý do] được ngăn cách bởi dấu phẩy.`;
};
