export const ticketEmailTemplate = (ticket, user, qrCode) => {
  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @font-face {
                  font-family: 'Montserrat';
                  src: url(https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCs16Hw5aX8.ttf) format('truetype');
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                }
                
                .ticket-container {
                    font-family: 'Montserrat', Arial, sans-serif;
                    max-width: 600px;
                    margin: 20px auto;
                    background: #fff;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    border-radius: 16px;
                    overflow: hidden;
                }
                
                .ticket-header {
                    background: linear-gradient(135deg, #e31937 0%, #ff4757 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    position: relative;
                }
                
                .ticket-header::after {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    left: 0;
                    right: 0;
                    height: 20px;
                    background: white;
                    clip-path: polygon(0 0, 100% 0, 50% 100%);
                }
                
                .ticket-body {
                    padding: 40px 30px;
                    background: #fff;
                }
                
                .ticket-details {
                    background: #fafafa;
                    border: 2px dashed #e31937;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 25px 0;
                    position: relative;
                }
                
                .ticket-details::before,
                .ticket-details::after {
                    content: '';
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    background: #f5f5f5;
                    border-radius: 50%;
                }
                
                .ticket-details::before {
                    top: 50%;
                    left: -17px;
                    transform: translateY(-50%);
                }
                
                .ticket-details::after {
                    top: 50%;
                    right: -17px;
                    transform: translateY(-50%);
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 12px 0;
                    padding: 10px 0;
                    border-bottom: 1px dashed #e0e0e0;
                }
                
                .detail-label {
                    color: #e31937;
                    font-weight: 600;
                    min-width: 130px;
                }
                
                .detail-value {
                    text-align: right;
                    color: #333;
                    font-weight: 500;
                }
                
                .ticket-code {
                    background: #f8d7da;
                    color: #e31937;
                    padding: 8px 15px;
                    border-radius: 6px;
                    font-weight: 600;
                    display: inline-block;
                    margin-bottom: 15px;
                }
                
                .barcode {
                    text-align: center;
                    padding: 30px 0;
                    border-top: 2px dashed #eee;
                    margin-top: 25px;
                }
                
                .barcode-image {
                    background: linear-gradient(90deg, #333 2px, transparent 2px), linear-gradient(90deg, #333 1px, transparent 1px);
                    background-size: 4px 100%, 2px 100%;
                    height: 60px;
                    width: 240px;
                    margin: 0 auto;
                }
                
                .barcode-text {
                    font-family: monospace;
                    font-size: 16px;
                    color: #666;
                    margin-top: 15px;
                    letter-spacing: 2px;
                }
                
                .ticket-footer {
                    background: linear-gradient(135deg, #e31937 0%, #ff4757 100%);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    font-size: 0.95em;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="ticket-container">
                <div class="ticket-header">
                    <h1 style="margin:0;font-size:2.2em;">VCineP</h1>
                    <p style="margin:8px 0 0;font-size:1.2em;">Vé Xem Phim Của Bạn</p>
                </div>
                
                <div class="ticket-body">
                    <h2 style="color:#e31937;margin:0 0 20px;font-size:1.5em;">Xin chào ${
                      user.username
                    },</h2>
                    <p style="color:#666;line-height:1.6;">Cảm ơn bạn đã đặt vé tại VCineP. Dưới đây là thông tin vé của bạn:</p>
                    
                    <div class="ticket-code">Mã vé: ${ticket.code}</div>
                    
                    <div class="ticket-details">
                        <div class="detail-row">
                            <span class="detail-label">Phim:</span>
                            <span class="detail-value">${
                              ticket.movie.title
                            }</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Suất chiếu:</span>
                            <span class="detail-value">${new Date(
                              ticket.showDate
                            ).toLocaleDateString()} lúc ${
    ticket.showTime
  }</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Rạp:</span>
                            <span class="detail-value">${
                              ticket.theater.name
                            } - ${ticket.theater.cinemaId.name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Ghế:</span>
                            <span class="detail-value">${ticket.seats}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Combo:</span>
                            <span class="detail-value">${
                              ticket.concession || "Không có"
                            }</span>
                        </div>
                        <div class="detail-row" style="border-bottom:none;">
                            <span class="detail-label">Tổng tiền:</span>
                            <span class="detail-value" style="color:#e31937;font-weight:700;font-size:1.1em;">${ticket.totalPrice.toLocaleString(
                              "vi-VN"
                            )} VNĐ</span>
                        </div>
                    </div>
                    
                    <div class="barcode">
                        <div class="barcode-image"></div>
                        <p class="barcode-text">${Math.random()
                          .toString(36)
                          .substr(2, 10)
                          .toUpperCase()}</p>
                    </div>
                </div>
                
                <div class="ticket-footer">
                    <p style="margin:0;">Vui lòng đến trước giờ chiếu 15 phút để check-in</p>
                    <p style="margin:8px 0 0;">Chúc bạn xem phim vui vẻ!</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
