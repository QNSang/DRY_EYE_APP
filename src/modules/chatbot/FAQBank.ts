/**
 * FAQ Bank for Dry Eye Advisor
 * Contains all questions and answers for the FAQ chatbot
 */

export interface FAQItem {
    id: string;
    category: FAQCategory;
    question: string;
    answer: string;
    relatedIds?: string[]; // Related FAQ items
}

export type FAQCategory =
    | 'basics'      // Kiến thức cơ bản
    | 'symptoms'    // Triệu chứng
    | 'prevention'  // Phòng ngừa
    | 'treatment'   // Điều trị
    | 'lifestyle'   // Lối sống
    | 'technology'; // Công nghệ

export interface CategoryInfo {
    id: FAQCategory;
    name: string;
    icon: string;
    description: string;
}

export const FAQ_CATEGORIES: CategoryInfo[] = [
    {
        id: 'basics',
        name: 'Kiến thức cơ bản',
        icon: 'ph-duotone ph-book-open',
        description: 'Hiểu về bệnh khô mắt'
    },
    {
        id: 'symptoms',
        name: 'Triệu chứng',
        icon: 'ph-duotone ph-eye-closed',
        description: 'Nhận biết dấu hiệu'
    },
    {
        id: 'prevention',
        name: 'Phòng ngừa',
        icon: 'ph-duotone ph-shield-check',
        description: 'Cách bảo vệ mắt'
    },
    {
        id: 'treatment',
        name: 'Điều trị',
        icon: 'ph-duotone ph-first-aid-kit',
        description: 'Khi cần can thiệp'
    },
    {
        id: 'lifestyle',
        name: 'Lối sống',
        icon: 'ph-duotone ph-leaf',
        description: 'Thói quen tốt cho mắt'
    },
    {
        id: 'technology',
        name: 'Công nghệ',
        icon: 'ph-duotone ph-cpu',
        description: 'Mắt và thiết bị số'
    }
];

export const FAQ_BANK: FAQItem[] = [
    // ===== BASICS =====
    {
        id: 'what-is-dry-eye',
        category: 'basics',
        question: 'Bệnh khô mắt là gì?',
        answer: `Khô mắt (Dry Eye Disease - DED) là tình trạng mắt không sản xuất đủ nước mắt hoặc nước mắt bốc hơi quá nhanh, dẫn đến bề mặt mắt không được bôi trơn đầy đủ.

**Có 2 loại khô mắt:**
• Thiếu nước mắt: Tuyến lệ không sản xuất đủ
• Nước mắt bốc hơi nhanh: Lớp dầu trong nước mắt bất thường

Đây là bệnh phổ biến, đặc biệt ở người làm việc với màn hình nhiều giờ.`,
        relatedIds: ['causes', 'who-gets-dry-eye']
    },
    {
        id: 'causes',
        category: 'basics',
        question: 'Nguyên nhân gây khô mắt?',
        answer: `**Nguyên nhân chính:**

{ph-device-tablet} **Sử dụng màn hình nhiều**
Khi tập trung nhìn màn hình, ta chớp mắt ít hơn 60-70%

{ph-thermometer} **Môi trường**
Điều hòa, gió, độ ẩm thấp, ô nhiễm không khí

{ph-pill} **Thuốc**
Thuốc dị ứng, thuốc trầm cảm, thuốc huyết áp

{ph-user} **Tuổi tác và giới tính**
Phổ biến hơn ở người trên 50 tuổi và phụ nữ

{ph-hospital} **Bệnh lý**
Tiểu đường, viêm khớp, lupus, bệnh tuyến giáp`,
        relatedIds: ['what-is-dry-eye', 'symptoms-list']
    },
    {
        id: 'who-gets-dry-eye',
        category: 'basics',
        question: 'Ai dễ bị khô mắt?',
        answer: `**Nhóm nguy cơ cao:**

{ph-briefcase} **Dân văn phòng**
Làm việc với máy tính > 6 tiếng/ngày

{ph-gender-female} **Phụ nữ**
Do thay đổi hormone, đặc biệt sau mãn kinh

{ph-hourglass} **Người trên 50 tuổi**
Sản xuất nước mắt giảm theo tuổi

{ph-device-mobile} **Gen Z/Millennials**
Sử dụng smartphone nhiều giờ

{ph-game-controller} **Game thủ**
Tập trung cao, ít chớp mắt

{ph-eyeglasses} **Người đeo kính áp tròng**
Kính làm giảm oxy đến giác mạc`,
        relatedIds: ['causes', 'prevention-basics']
    },

    // ===== SYMPTOMS =====
    {
        id: 'symptoms-list',
        category: 'symptoms',
        question: 'Làm sao biết tôi bị khô mắt?',
        answer: `**Triệu chứng phổ biến:**

{ph-warning-octagon} **Cảm giác khó chịu**
• Mắt khô, rát, cộm như có cát
• Ngứa mắt, mỏi mắt
• Nóng hoặc châm chích

{ph-eye} **Thay đổi thị giác**
• Mờ mắt thoáng qua
• Nhạy cảm với ánh sáng
• Khó nhìn vào ban đêm

{ph-drop} **Nghịch lý chảy nước mắt**
• Mắt chảy nước nhiều (phản ứng bù)
• Nước mắt loãng, không bôi trơn tốt

{ph-warning} **Khi nào cần gặp bác sĩ:**
Triệu chứng kéo dài > 2 tuần hoặc ảnh hưởng đến sinh hoạt`,
        relatedIds: ['when-see-doctor', 'what-is-dry-eye']
    },
    {
        id: 'eye-strain-vs-dry-eye',
        category: 'symptoms',
        question: 'Mỏi mắt và khô mắt khác nhau thế nào?',
        answer: `**Mỏi mắt (Eye Strain):**
• Thường do tập trung lâu
• Giảm sau khi nghỉ ngơi
• Đau đầu, đau cổ vai gáy
• KHÔNG phải bệnh lý

**Khô mắt (Dry Eye):**
• Do thiếu nước mắt
• Cảm giác khô, cộm, rát
• Không hết hoàn toàn khi nghỉ
• CÓ THỂ là bệnh lý cần điều trị

{ph-lightbulb} **Lưu ý:** Hai tình trạng thường đi kèm nhau. Mỏi mắt kéo dài có thể dẫn đến khô mắt.`,
        relatedIds: ['symptoms-list', 'prevention-basics']
    },

    // ===== PREVENTION =====
    {
        id: '20-20-20-rule',
        category: 'prevention',
        question: 'Quy tắc 20-20-20 là gì?',
        answer: `**Quy tắc vàng bảo vệ mắt:**

{ph-timer} **Mỗi 20 phút** làm việc với màn hình
{ph-binoculars} **Nhìn xa 20 feet** (khoảng 6 mét)
{ph-hourglass-simple} **Trong 20 giây**

**Tại sao hiệu quả?**
• Cho mắt thư giãn cơ điều tiết
• Kích thích chớp mắt tự nhiên
• Giảm mỏi mắt đáng kể

**Mẹo thực hiện:**
• Dùng app DryEyeGuard để được nhắc tự động
• Đặt timer trên điện thoại
• Nhìn ra cửa sổ, nhìn cây xanh

{ph-sparkle} Nghiên cứu cho thấy giảm 50% triệu chứng mỏi mắt!`,
        relatedIds: ['blink-rate', 'screen-distance']
    },
    {
        id: 'blink-rate',
        category: 'prevention',
        question: 'Nên chớp mắt bao nhiêu lần/phút?',
        answer: `**Tần suất chớp mắt chuẩn:**

{ph-check-circle} **Bình thường:** 15-20 lần/phút
{ph-x-circle} **Khi nhìn màn hình:** Chỉ còn 5-7 lần/phút

**Tại sao chớp mắt quan trọng?**
• Dàn đều nước mắt trên bề mặt mắt
• Cung cấp oxy cho giác mạc
• Loại bỏ bụi bẩn

**Cách cải thiện:**
1. **Chớp mắt có ý thức** - Nhắc bản thân chớp mắt
2. **Chớp mắt hoàn toàn** - Mi trên chạm mi dưới
3. **Bài tập 20-20-20** kết hợp chớp mắt 20 lần

{ph-lightbulb} App DryEyeGuard theo dõi tần suất chớp mắt của bạn qua camera!`,
        relatedIds: ['20-20-20-rule', 'incomplete-blink']
    },
    {
        id: 'incomplete-blink',
        category: 'prevention',
        question: 'Chớp mắt không hoàn toàn là gì?',
        answer: `**Incomplete Blink:**
Là khi mi mắt trên không chạm hoàn toàn vào mi dưới khi chớp.

**Tại sao xảy ra?**
• Tập trung cao độ khi làm việc
• Mắt mở to khi nhìn màn hình
• Thói quen xấu lâu ngày

**Hậu quả:**
• Nước mắt không được dàn đều
• Phần dưới giác mạc bị khô
• Tăng nguy cơ khô mắt

**Cách khắc phục:**
1. Chú ý chớp mắt HOÀN TOÀN
2. Thực hiện bài tập: Nhắm mắt 2 giây → Mở → Lặp lại 10 lần
3. Đặt màn hình thấp hơn tầm mắt 15-20°`,
        relatedIds: ['blink-rate', 'screen-distance']
    },
    {
        id: 'screen-distance',
        category: 'prevention',
        question: 'Khoảng cách an toàn với màn hình?',
        answer: `**Khoảng cách khuyến nghị:**

{ph-monitor} **Máy tính để bàn:** 50-70 cm (một cánh tay)
{ph-laptop} **Laptop:** 40-60 cm
{ph-device-mobile} **Điện thoại:** 30-40 cm

**Vị trí màn hình:**
• Mép trên màn hình ngang tầm mắt hoặc thấp hơn
• Nghiêng màn hình 10-20° về phía sau
• Tránh ánh sáng phản chiếu

**Tư thế ngồi:**
• Lưng thẳng, vai thả lỏng
• Khuỷu tay vuông góc 90°
• Chân chạm sàn

{ph-warning} Ngồi quá gần làm mắt phải điều tiết nhiều hơn!`,
        relatedIds: ['20-20-20-rule', 'workspace-setup']
    },
    {
        id: 'prevention-basics',
        category: 'prevention',
        question: 'Cách phòng ngừa khô mắt hiệu quả?',
        answer: `**5 Nguyên tắc vàng:**

1. **Quy tắc 20-20-20**
Mỗi 20 phút, nhìn xa 6m trong 20 giây

2. **Chớp mắt đầy đủ**
15-20 lần/phút, mi trên chạm mi dưới

3. **Khoảng cách an toàn**
Màn hình cách mắt 50-70cm

4. **Môi trường phù hợp**
Độ ẩm 40-60%, tránh gió thổi thẳng vào mắt

5. **Lối sống lành mạnh**
Ngủ đủ giấc, uống đủ nước, ăn omega-3

{ph-lightbulb} Dùng DryEyeGuard để thực hiện tất cả điều trên!`,
        relatedIds: ['20-20-20-rule', 'blink-rate', 'lifestyle-tips']
    },

    // ===== TREATMENT =====
    {
        id: 'when-see-doctor',
        category: 'treatment',
        question: 'Khi nào cần gặp bác sĩ?',
        answer: `**Gặp bác sĩ NGAY khi:**

{ph-warning-octagon} **Triệu chứng nghiêm trọng:**
• Đau mắt dữ dội
• Mất thị lực đột ngột
• Nhạy cảm ánh sáng nghiêm trọng
• Chảy mủ, tiết dịch bất thường

{ph-warning} **Triệu chứng kéo dài:**
• Khô mắt > 2 tuần không cải thiện
• Đỏ mắt liên tục
• Ảnh hưởng đến công việc/sinh hoạt
• Dùng nước mắt nhân tạo không hiệu quả

**Bác sĩ sẽ làm gì?**
• Kiểm tra màng nước mắt (TBUT test)
• Đo lượng nước mắt (Schirmer test)
• Kê đơn thuốc/gel bôi phù hợp
• Tư vấn điều trị chuyên sâu nếu cần`,
        relatedIds: ['artificial-tears', 'symptoms-list']
    },
    {
        id: 'artificial-tears',
        category: 'treatment',
        question: 'Nước mắt nhân tạo có tác dụng gì?',
        answer: `**Nước mắt nhân tạo (Artificial Tears):**
Là dung dịch bổ sung độ ẩm cho mắt, giúp bôi trơn và bảo vệ bề mặt mắt.

**Các loại phổ biến:**
{ph-drop} **Dạng nước** - Dùng ban ngày, nhẹ nhàng
{ph-flask} **Dạng gel** - Đặc hơn, dùng khi khô nặng
{ph-moon} **Dạng mỡ** - Dùng ban đêm

**Cách sử dụng:**
• 1-2 giọt/lần, 3-4 lần/ngày hoặc khi cần
• Ưu tiên loại KHÔNG có chất bảo quản
• Đợi 5 phút trước khi nhỏ thuốc khác

{ph-warning} **Lưu ý:**
• Mua tại nhà thuốc uy tín
• Đọc kỹ hướng dẫn sử dụng
• Nếu dùng > 4 lần/ngày, nên gặp bác sĩ`,
        relatedIds: ['when-see-doctor', 'prevention-basics']
    },

    // ===== LIFESTYLE =====
    {
        id: 'lifestyle-tips',
        category: 'lifestyle',
        question: 'Thói quen nào tốt cho mắt?',
        answer: `**Thói quen hàng ngày:**

{ph-drop} **Uống đủ nước**
2-3 lít/ngày giúp duy trì độ ẩm mắt

{ph-bed} **Ngủ đủ giấc**
7-8 tiếng, mắt được nghỉ ngơi và tái tạo

{ph-bowl-food} **Ăn uống lành mạnh**
Omega-3 (cá hồi, hạt), Vitamin A (cà rốt, rau xanh)

{ph-activity} **Vận động thường xuyên**
Cải thiện tuần hoàn máu đến mắt

{ph-moon} **Tránh màn hình trước ngủ**
Ít nhất 1 tiếng trước khi ngủ

{ph-wind} **Tránh khói thuốc**
Khói làm kích ứng và khô mắt`,
        relatedIds: ['food-for-eyes', 'sleep-and-eyes']
    },
    {
        id: 'food-for-eyes',
        category: 'lifestyle',
        question: 'Thức ăn nào tốt cho mắt?',
        answer: `**Thực phẩm giàu Omega-3:**
{ph-fish} Cá hồi, cá thu, cá ngừ
{ph-target} Hạt chia, hạt lanh, óc chó
→ Giúp ổn định lớp dầu trong nước mắt

**Thực phẩm giàu Vitamin A:**
{ph-leaf} Cà rốt, bí đỏ
{ph-leaf} Rau cải xanh, rau bina
→ Bảo vệ giác mạc và võng mạc

**Thực phẩm giàu Vitamin C & E:**
{ph-orange} Cam, chanh, kiwi
{ph-leaf} Bơ, hạnh nhân
→ Chống oxy hóa, bảo vệ mắt

**Thực phẩm giàu kẽm:**
{ph-cooking-pot} Thịt bò, hàu
{ph-dots-three} Đậu, đỗ
→ Hỗ trợ hấp thu vitamin, sức khỏe võng mạc

{ph-lightbulb} Ăn đa dạng, cân bằng là tốt nhất!`,
        relatedIds: ['lifestyle-tips', 'prevention-basics']
    },
    {
        id: 'sleep-and-eyes',
        category: 'lifestyle',
        question: 'Giấc ngủ ảnh hưởng mắt thế nào?',
        answer: `**Tầm quan trọng của giấc ngủ:**

{ph-bed} **Khi ngủ, mắt được:**
• Nghỉ ngơi hoàn toàn
• Tái tạo tế bào bề mặt
• Sản xuất và phân phối nước mắt đều

{ph-x-circle} **Thiếu ngủ gây ra:**
• Mắt khô, mỏi, đỏ
• Giảm sản xuất nước mắt
• Co giật mí mắt
• Quầng thâm, bọng mắt

**Khuyến nghị:**
• Ngủ 7-8 tiếng/đêm
• Giữ phòng ngủ tối, mát
• Không dùng điện thoại 1h trước ngủ
• Giờ ngủ đều đặn

{ph-moon-stars} Giấc ngủ chất lượng = Mắt khỏe mạnh!`,
        relatedIds: ['lifestyle-tips', 'smart-device-bed']
    },

    // ===== TECHNOLOGY =====
    {
        id: 'blue-light-filter',
        category: 'technology',
        question: 'Kính lọc ánh sáng xanh có hiệu quả?',
        answer: `**Ánh sáng xanh (Blue Light):**
Ánh sáng có bước sóng 400-500nm, phát ra từ màn hình và đèn LED.

**Kính lọc ánh sáng xanh:**
{ph-check-circle} **Có thể giúp:**
• Giảm mỏi mắt khi làm việc lâu
• Cải thiện giấc ngủ nếu dùng buổi tối
• Giảm chói khi nhìn màn hình

{ph-x-circle} **Chưa có bằng chứng:**
• Ngăn ngừa khô mắt
• Bảo vệ võng mạc lâu dài

**Khuyến nghị:**
• Có thể dùng nếu cảm thấy thoải mái hơn
• Bật Night Shift/Night Light miễn phí trên thiết bị
• Quan trọng hơn: Nghỉ mắt thường xuyên!

{ph-lightbulb} Kính lọc ánh sáng xanh KHÔNG thay thế được quy tắc 20-20-20!`,
        relatedIds: ['20-20-20-rule', 'screen-settings']
    },
    {
        id: 'screen-settings',
        category: 'technology',
        question: 'Cài đặt màn hình tối ưu?',
        answer: `**Điều chỉnh màn hình:**

{ph-sun} **Độ sáng:**
• Bằng hoặc hơi sáng hơn môi trường xung quanh
• Không quá chói hoặc quá tối

{ph-palette} **Màu sắc:**
• Bật Night Shift/Night Light buổi tối
• Giảm ánh sáng xanh sau 8PM

{ph-ruler} **Kích thước chữ:**
• Đủ lớn để đọc thoải mái
• Zoom 125-150% nếu cần

{ph-moon} **Dark Mode:**
• Có thể giảm mỏi mắt trong môi trường tối
• Không bắt buộc, tùy sở thích

{ph-lightbulb} **Mẹo:**
• Tránh dùng màn hình trong phòng tối
• Đặt đèn bàn chiếu sáng xung quanh
• Tránh ánh sáng phản chiếu vào màn hình`,
        relatedIds: ['blue-light-filter', 'workspace-setup']
    },
    {
        id: 'workspace-setup',
        category: 'technology',
        question: 'Bố trí góc làm việc tốt cho mắt?',
        answer: `**Góc làm việc lý tưởng:**

{ph-monitor} **Màn hình:**
• Cách mắt 50-70cm
• Mép trên ngang tầm mắt
• Nghiêng về sau 10-20°
• Không có ánh sáng phản chiếu

{ph-lightbulb} **Ánh sáng:**
• Đèn bàn chiếu từ bên cạnh
• Ánh sáng đều, không chói
• Độ sáng phòng phù hợp với màn hình

{ph-window} **Cửa sổ:**
• Màn hình vuông góc với cửa sổ
• Có rèm che nếu nắng chiếu trực tiếp

{ph-plant} **Môi trường:**
• Độ ẩm 40-60%
• Tránh điều hòa thổi thẳng vào mặt
• Đặt cây xanh trong phòng

{ph-chair} **Ghế ngồi:**
• Có tựa lưng tốt
• Cao vừa để chân chạm sàn`,
        relatedIds: ['screen-distance', 'screen-settings']
    },
    {
        id: 'smart-device-bed',
        category: 'technology',
        question: 'Tại sao không nên dùng điện thoại trước ngủ?',
        answer: `**Tác hại của màn hình trước ngủ:**

{ph-drop-half} **Ánh sáng xanh:**
• Ức chế hormone melatonin
• Làm khó đi vào giấc ngủ
• Giảm chất lượng giấc ngủ

{ph-eye-slash} **Mắt làm việc quá sức:**
• Mắt không được nghỉ ngơi
• Tăng nguy cơ khô mắt ban đêm
• Mỏi mắt tích lũy

{ph-brain} **Kích thích não:**
• Khó thư giãn, khó ngủ
• Giảm giấc ngủ sâu
• Mệt mỏi ngày hôm sau

**Khuyến nghị:**
1. Dừng dùng thiết bị 1 giờ trước ngủ
2. Bật Night Mode nếu cần dùng
3. Thay bằng đọc sách, nghe nhạc
4. Để điện thoại xa giường ngủ`,
        relatedIds: ['sleep-and-eyes', 'lifestyle-tips']
    }
];

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(category: FAQCategory): FAQItem[] {
    return FAQ_BANK.filter(faq => faq.category === category);
}

/**
 * Get FAQ by ID
 */
export function getFAQById(id: string): FAQItem | undefined {
    return FAQ_BANK.find(faq => faq.id === id);
}

/**
 * Get related FAQs
 */
export function getRelatedFAQs(faqId: string): FAQItem[] {
    const faq = getFAQById(faqId);
    if (!faq || !faq.relatedIds) return [];

    return faq.relatedIds
        .map(id => getFAQById(id))
        .filter((item): item is FAQItem => item !== undefined);
}

/**
 * Search FAQs by keyword
 */
export function searchFAQs(keyword: string): FAQItem[] {
    const lowerKeyword = keyword.toLowerCase();
    return FAQ_BANK.filter(faq =>
        faq.question.toLowerCase().includes(lowerKeyword) ||
        faq.answer.toLowerCase().includes(lowerKeyword)
    );
}
