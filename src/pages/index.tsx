import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import React, { useState, useEffect } from "react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"]
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"]
});

// Custom Modal Component for success messages
const SuccessModal = ({ message, onClose }: { message: string; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-tan p-8 rounded-xl shadow-2xl max-w-sm w-full text-center border-2 border-sienna transform scale-100 animate-fade-in-up">
                <h3 className="text-2xl font-semibold text-saddleBrown mb-4">Thành Công!</h3>
                <p className="text-charcoalCoffee mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-saddleBrown text-wheat py-2 px-6 rounded-lg text-lg font-semibold hover:bg-sienna transition duration-300 shadow-md"
                >
                    Đóng
                </button>
            </div>
        </div>
    );
};

// Main App Component (simulates Next.js routing within a single file)
const App = () => {
    // In a real Next.js app, you'd use `useRouter` for actual routing
    const [currentPath, setCurrentPath] = useState("/"); // Represents the current URL path
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const navigateTo = (path: any) => {
        setCurrentPath(path);
        setIsMobileMenuOpen(false);
    };

    const buttonClass = (path: any) =>
        `px-4 py-2 rounded-lg transition duration-300 ${
            currentPath === path ? "bg-saddleBrown text-tan shadow-lg" : "text-saddleBrown hover:bg-sienna hover:text-wheat"
        }`;

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-wheat text-coffee text-2xl animate-pulse">Đang tải trang...</div>;
    }

    // Determine which page component to render based on currentPath
    let PageComponent;
    switch (currentPath) {
        case "/menu":
            PageComponent = MenuPage;
            break;
        case "/about":
            PageComponent = AboutPage;
            break;
        case "/gallery":
            PageComponent = GalleryPage;
            break;
        case "/contact":
            PageComponent = ContactPage;
            break;
        case "/":
        default:
            PageComponent = HomePage;
            break;
    }

    return (
        <div className="min-h-screen flex flex-col bg-wheat font-inter">
            {/* Navbar */}
            <nav className="bg-tan p-4 shadow-md sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="text-2xl font-bold text-saddleBrown cursor-pointer" onClick={() => navigateTo("/")}>
                        Go Cafe
                    </div>
                    {/* Desktop Navigation */}
                    <ul className="hidden md:flex space-x-6">
                        <li>
                            <button onClick={() => navigateTo("/")} className={buttonClass("/")}>
                                Trang chủ
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/menu")} className={buttonClass("/menu")}>
                                Menu
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/about")} className={buttonClass("/about")}>
                                Giới thiệu
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/gallery")} className={buttonClass("/gallery")}>
                                Thư viện ảnh
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/contact")} className={buttonClass("/contact")}>
                                Liên hệ & Đặt bàn
                            </button>
                        </li>
                    </ul>
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-saddleBrown focus:outline-none"
                            aria-label="Toggle navigation"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <ul className="md:hidden flex flex-col items-center mt-4 space-y-3 bg-tan pb-4 rounded-b-lg">
                        <li>
                            <button onClick={() => navigateTo("/")} className={buttonClass("/")}>
                                Trang chủ
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/menu")} className={buttonClass("/menu")}>
                                Menu
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/about")} className={buttonClass("/about")}>
                                Giới thiệu
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/gallery")} className={buttonClass("/gallery")}>
                                Thư viện ảnh
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo("/contact")} className={buttonClass("/contact")}>
                                Liên hệ & Đặt bàn
                            </button>
                        </li>
                    </ul>
                )}
            </nav>

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto p-4 md:p-8">
                <PageComponent /> {/* Render the determined page component */}
            </main>

            {/* Footer */}
            <footer className="bg-coffee text-wheat p-6 text-center shadow-inner mt-8">
                <div className="container mx-auto">
                    <p className="mb-2">&copy; 2025 Go Cafe. Mọi quyền được bảo lưu.</p>
                    <div className="flex justify-center space-x-4">
                        <a href="#" className="hover:text-tan transition duration-300">
                            <i className="fab fa-facebook-f"></i> Facebook
                        </a>
                        <a href="#" className="hover:text-tan transition duration-300">
                            <i className="fab fa-instagram"></i> Instagram
                        </a>
                    </div>
                    <p className="mt-2 text-sm">Thiết kế bởi HUNGLM</p>
                </div>
            </footer>

            {/* Font Awesome for social icons, etc. */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
        </div>
    );
};

// Home Page Component
const HomePage = () => (
    <section className="text-center py-12 px-4">
        <h1 className="text-5xl md:text-6xl font-serif text-saddleBrown mb-6 leading-tight">
            <span className="block italic">"Nơi thời gian chậm lại,</span>
            <span className="block">Hương vị lên ngôi."</span>
        </h1>
        <p className="text-lg md:text-xl text-charcoalCoffee max-w-3xl mx-auto mb-10">
            Chào mừng đến với Go Cafe, nơi bạn có thể tìm thấy sự bình yên giữa lòng thành phố nhộn nhịp. Chúng tôi tự hào mang đến không gian Vintage
            ấm cúng, gần gũi với thiên nhiên và những món đồ uống, đồ ăn kèm hấp dẫn.
        </p>

        {/* Hero Image */}
        <div className="mb-12 rounded-xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-500">
            <img
                src="https://placehold.co/1200x600/D2B48C/6F4E37?text=Kh%C3%B4ng+Gian+Qu%C3%A1n+Cafe+M%E1%BB%99c"
                alt="Không gian quán cafe ấm cúng"
                className="w-full h-auto object-cover"
                onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/1200x600/D2B48C/6F4E37?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh";
                }}
            />
        </div>

        {/* Featured Menu */}
        <h2 className="text-4xl font-serif text-saddleBrown mb-8">Menu Nổi Bật</h2>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-tan p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                <img
                    src="https://placehold.co/300x200/6F4E37/F5DEB3?text=C%C3%A0+Ph%C3%AA+S%E1%BB%AFa+%C4%90%C3%A1"
                    alt="Cà Phê Sữa Đá"
                    className="w-full h-48 object-cover rounded-md mb-4"
                    onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/300x200/6F4E37/F5DEB3?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh";
                    }}
                />
                <h3 className="text-2xl font-semibold text-charcoalCoffee mb-2">Cà Phê Sữa Đá Đặc Biệt</h3>
                <p className="text-sienna text-lg">Hương vị truyền thống Việt Nam, đậm đà khó quên.</p>
                <p className="text-saddleBrown font-bold text-xl mt-3">45.000 VNĐ</p>
            </div>
            <div className="bg-tan p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                <img
                    src="https://placehold.co/300x200/A0522D/F5DEB3?text=Tr%C3%A0+V%C3%A1i"
                    alt="Trà Vải"
                    className="w-full h-48 object-cover rounded-md mb-4"
                    onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/300x200/A0522D/F5DEB3?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh";
                    }}
                />
                <h3 className="text-2xl font-semibold text-charcoalCoffee mb-2">Trà Vải Nhiệt Đới</h3>
                <p className="text-sienna text-lg">Thức uống giải khát hoàn hảo cho ngày hè oi ả.</p>
                <p className="text-saddleBrown font-bold text-xl mt-3">50.000 VNĐ</p>
            </div>
            <div className="bg-tan p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                <img
                    src="https://placehold.co/300x200/8B4513/F5DEB3?text=B%C3%A1nh+Tiramisu"
                    alt="Bánh Tiramisu"
                    className="w-full h-48 object-cover rounded-md mb-4"
                    onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/300x200/8B4513/F5DEB3?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh";
                    }}
                />
                <h3 className="text-2xl font-semibold text-charcoalCoffee mb-2">Bánh Tiramisu Ý</h3>
                <p className="text-sienna text-lg">Món tráng miệng kinh điển, mềm mịn và thơm lừng.</p>
                <p className="text-saddleBrown font-bold text-xl mt-3">65.000 VNĐ</p>
            </div>
        </div>

        {/* Promotions */}
        <div className="bg-sienna p-8 rounded-xl shadow-xl text-wheat">
            <h2 className="text-4xl font-serif mb-6">Khuyến Mãi Mới Nhất</h2>
            <p className="text-xl mb-4">Giảm 15% tổng hóa đơn cho khách hàng mới đăng ký thành viên!</p>
            <p className="text-xl mb-4">Miễn phí 1 bánh bất kỳ khi mua 2 đồ uống cùng loại vào mỗi thứ 3 hàng tuần.</p>
            <p className="text-lg">Theo dõi Fanpage của chúng tôi để không bỏ lỡ những ưu đãi hấp dẫn khác!</p>
        </div>
    </section>
);

// Menu Page Component
const MenuPage = () => {
    const categories = [
        {
            name: "Cà phê",
            items: [
                { name: "Espresso", price: "35.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Espresso" },
                { name: "Americano", price: "40.000 VNĐ", image: "https://placehold.co/150x150/A0522D/F5DEB3?text=Americano" },
                { name: "Latte", price: "50.000 VNĐ", image: "https://placehold.co/150x150/8B4513/F5DEB3?text=Latte" },
                { name: "Cappuccino", price: "50.000 VNĐ", image: "https://placehold.co/150x150/D2B48C/6F4E37?text=Cappuccino" },
                { name: "Cà phê sữa đá", price: "45.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Ca+Phe+Sua" }
            ]
        },
        {
            name: "Trà",
            items: [
                { name: "Trà Đào Cam Sả", price: "55.000 VNĐ", image: "https://placehold.co/150x150/A0522D/F5DEB3?text=Tra+Dao" },
                { name: "Trà Vải Nhiệt Đới", price: "50.000 VNĐ", image: "https://placehold.co/150x150/8B4513/F5DEB3?text=Tra+Vai" },
                { name: "Trà Atiso", price: "45.000 VNĐ", image: "https://placehold.co/150x150/D2B48C/6F4E37?text=Tra+Atiso" }
            ]
        },
        {
            name: "Bánh ngọt",
            items: [
                { name: "Tiramisu", price: "65.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Tiramisu" },
                { name: "Bánh Mousse Chanh Leo", price: "60.000 VNĐ", image: "https://placehold.co/150x150/A0522D/F5DEB3?text=Mousse" },
                { name: "Red Velvet", price: "60.000 VNĐ", image: "https://placehold.co/150x150/8B4513/F5DEB3?text=Red+Velvet" }
            ]
        },
        {
            name: "Đồ uống lạnh khác",
            items: [
                { name: "Soda Việt Quất", price: "55.000 VNĐ", image: "https://placehold.co/150x150/D2B48C/6F4E37?text=Soda" },
                { name: "Nước Ép Cam Tươi", price: "45.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Nuoc+Ep+Cam" }
            ]
        }
    ];

    return (
        <section className="py-12 px-4">
            <h1 className="text-5xl font-serif text-saddleBrown text-center mb-10">Menu Đầy Đủ</h1>
            {categories.map((category) => (
                <div key={category.name} className="mb-12">
                    <h2 className="text-4xl font-semibold text-charcoalCoffee mb-6 border-b-2 border-sienna pb-3 text-center">{category.name}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {category.items.map((item) => (
                            <div
                                key={item.name}
                                className="bg-tan p-6 rounded-xl shadow-lg flex flex-col items-center text-center hover:shadow-xl transform hover:-translate-y-2 transition-transform duration-300"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-32 h-32 object-cover rounded-full mb-4 border-2 border-sienna"
                                    onError={(e: any) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/150x150/D2B48C/6F4E37?text=L%E1%BB%97i+%E1%BA%A3nh";
                                    }}
                                />
                                <h3 className="text-2xl font-bold text-saddleBrown mb-2">{item.name}</h3>
                                <p className="text-coffee text-xl font-semibold">{item.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
};

// About Page Component
const AboutPage = () => (
    <section className="py-12 px-4">
        <h1 className="text-5xl font-serif text-saddleBrown text-center mb-10">Về Chúng Tôi</h1>
        <div className="bg-tan p-8 rounded-xl shadow-lg max-w-4xl mx-auto text-charcoalCoffee leading-relaxed">
            <h2 className="text-3xl font-semibold mb-4 text-center">Câu Chuyện Go Cafe</h2>
            <p className="mb-6 text-lg">
                Go Cafe ra đời từ niềm đam mê bất tận với cà phê và tình yêu dành cho sự mộc mạc, bình dị. Chúng tôi tin rằng một tách cà phê ngon
                không chỉ là hương vị, mà còn là trải nghiệm không gian, là sự kết nối giữa con người với thiên nhiên. Với phong cách thiết kế Vintage
                chủ đạo là gỗ, cây xanh và ánh sáng tự nhiên, Go Cafe mong muốn mang đến một chốn dừng chân lý tưởng, nơi bạn có thể gác lại những bộn
                bề cuộc sống và tận hưởng những khoảnh khắc an yên.
            </p>
            <p className="mb-6 text-lg">
                Mỗi món đồ uống, mỗi chiếc bánh tại đây đều được chúng tôi chăm chút tỉ mỉ từ nguyên liệu tươi ngon nhất, qua bàn tay pha chế tài hoa
                để tạo nên hương vị đặc trưng, khó quên.
            </p>

            <h2 className="text-3xl font-semibold mb-4 text-center mt-8">Tầm Nhìn</h2>
            <p className="mb-6 text-lg">
                Trở thành điểm đến yêu thích của những ai tìm kiếm không gian thư giãn, thưởng thức cà phê chất lượng và hòa mình vào vẻ đẹp của thiên
                nhiên mộc mạc. Chúng tôi không chỉ bán cà phê, chúng tôi bán trải nghiệm.
            </p>

            <h2 className="text-3xl font-semibold mb-4 text-center mt-8">Phong Cách Phục Vụ</h2>
            <p className="mb-6 text-lg">
                Tại Go Cafe, bạn sẽ luôn cảm nhận được sự thân thiện, nhiệt tình và chuyên nghiệp từ đội ngũ nhân viên. Chúng tôi luôn lắng nghe và
                sẵn sàng phục vụ để mang đến cho bạn trải nghiệm tốt nhất. Sự hài lòng của khách hàng là niềm vui và động lực lớn nhất của chúng tôi.
            </p>
            <div className="text-center mt-8">
                <img
                    src="https://placehold.co/600x400/8B4513/F5DEB3?text=G%E1%BB%97+v%C3%A0+C%C3%A2y+Xanh"
                    alt="Vintage style interior with wood and plants"
                    className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                    onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/8B4513/F5DEB3?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh";
                    }}
                />
            </div>
        </div>
    </section>
);

// Gallery Page Component
const GalleryPage = () => {
    const images = [
        "https://placehold.co/600x400/D2B48C/6F4E37?text=G%C3%B3c+qu%C3%A1n+th%C6%B0+gi%C3%A3n",
        "https://placehold.co/600x400/A0522D/F5DEB3?text=B%C3%A0n+gh%E1%BA%BF+g%E1%BB%97+Vintage",
        "https://placehold.co/600x400/6F4E37/F5DEB3?text=Khu+v%C6%B0%E1%BB%9Dn+nh%E1%BB%8F+xanh+m%C3%A1t",
        "https://placehold.co/600x400/8B4513/F5DEB3?text=C%C3%A0+ph%C3%AA+ngh%E1%BB%87+thu%E1%BA%ADt",
        "https://placehold.co/600x400/F5DEB3/6F4E37?text=B%C3%A1nh+ng%E1%BB%8Dt+tuy%E1%BB%87t+h%E1%BA%A3o",
        "https://placehold.co/600x400/6F4E37/D2B48C?text=Kh%C3%B4ng+gian+l%C3%A3ng+m%E1%BA%A1n",
        "https://placehold.co/600x400/A0522D/D2B48C?text=S%E1%BB%B1+ki%E1%BB%87n+ch%C3%B9m+h%E1%BB%8D+b%E1%BA%A1n+b%C3%A8",
        "https://placehold.co/600x400/8B4513/D2B48C?text=C%C3%A1c+lo%E1%BA%A1i+tr%C3%A0+th%C6%A1m+ngon"
    ];

    return (
        <section className="py-12 px-4">
            <h1 className="text-5xl font-serif text-saddleBrown text-center mb-10">Thư Viện Ảnh</h1>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((src, index) => (
                    <div key={index} className="rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-500">
                        <img
                            src={src}
                            alt={`Ảnh quán cafe ${index + 1}`}
                            className="w-full h-64 object-cover"
                            onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/600x400/D2B48C/6F4E37?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh";
                            }}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

// Contact Page Component
const ContactPage = () => {
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        // In a real application, this data would be sent to a backend server.
        console.log("Thông tin đặt bàn:", {
            name: e.target.name.value,
            phone: e.target.phone.value,
            date: e.target.date.value,
            time: e.target.time.value,
            guests: e.target.guests.value,
            message: e.target.message.value
        });
        setShowSuccessModal(true); // Show custom modal
        e.target.reset(); // Clear form
    };

    return (
        <section className="py-12 px-4">
            <h1 className="text-5xl font-serif text-saddleBrown text-center mb-10">Liên Hệ & Đặt Bàn</h1>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="bg-tan p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-semibold text-charcoalCoffee mb-6 text-center">Form Đặt Bàn Trực Tuyến</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-saddleBrown text-lg font-medium mb-2">
                                Họ và tên:
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="w-full p-3 rounded-md border border-sienna focus:border-coffee focus:ring focus:ring-coffee focus:ring-opacity-50 transition duration-200 bg-wheat text-charcoalCoffee"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-saddleBrown text-lg font-medium mb-2">
                                Số điện thoại:
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                required
                                className="w-full p-3 rounded-md border border-sienna focus:border-coffee focus:ring focus:ring-coffee focus:ring-opacity-50 transition duration-200 bg-wheat text-charcoalCoffee"
                                placeholder="0912 345 678"
                            />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="date" className="block text-saddleBrown text-lg font-medium mb-2">
                                    Ngày đặt:
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    required
                                    className="w-full p-3 rounded-md border border-sienna focus:border-coffee focus:ring focus:ring-coffee focus:ring-opacity-50 transition duration-200 bg-wheat text-charcoalCoffee"
                                />
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-saddleBrown text-lg font-medium mb-2">
                                    Giờ đặt:
                                </label>
                                <input
                                    type="time"
                                    id="time"
                                    name="time"
                                    required
                                    className="w-full p-3 rounded-md border border-sienna focus:border-coffee focus:ring focus:ring-coffee focus:ring-opacity-50 transition duration-200 bg-wheat text-charcoalCoffee"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="guests" className="block text-saddleBrown text-lg font-medium mb-2">
                                Số lượng khách:
                            </label>
                            <input
                                type="number"
                                id="guests"
                                name="guests"
                                min="1"
                                max="20"
                                defaultValue="2"
                                required
                                className="w-full p-3 rounded-md border border-sienna focus:border-coffee focus:ring focus:ring-coffee focus:ring-opacity-50 transition duration-200 bg-wheat text-charcoalCoffee"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-saddleBrown text-lg font-medium mb-2">
                                Tin nhắn (Tùy chọn):
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                className="w-full p-3 rounded-md border border-sienna focus:border-coffee focus:ring focus:ring-coffee focus:ring-opacity-50 transition duration-200 bg-wheat text-charcoalCoffee"
                                placeholder="Yêu cầu đặc biệt hoặc ghi chú..."
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-saddleBrown text-tan py-3 rounded-lg text-xl font-semibold hover:bg-sienna transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Gửi Yêu Cầu Đặt Bàn
                        </button>
                    </form>
                </div>

                {/* Contact Info & Map */}
                <div className="space-y-8">
                    <div className="bg-tan p-8 rounded-xl shadow-lg text-charcoalCoffee">
                        <h2 className="text-3xl font-semibold mb-6 text-center">Thông Tin Liên Hệ</h2>
                        <p className="text-lg mb-4 flex items-center">
                            <i className="fas fa-map-marker-alt text-sienna mr-3 text-2xl"></i>
                            <span>Địa chỉ: 4 ngõ 43 Quang Trung, Nam Hồng, Hồng Lĩnh, Hà Tĩnh</span>
                        </p>
                        <p className="text-lg mb-4 flex items-center">
                            <i className="fas fa-phone-alt text-sienna mr-3 text-2xl"></i>
                            <span>Điện thoại: 024 1234 5678</span>
                        </p>
                        <p className="text-lg mb-4 flex items-center">
                            <i className="fas fa-envelope text-sienna mr-3 text-2xl"></i>
                            <span>Email: info@godecorvn.com</span>
                        </p>
                        <p className="text-lg flex items-center">
                            <i className="fas fa-clock text-sienna mr-3 text-2xl"></i>
                            <span>Giờ mở cửa: 8:00 - 22:00 hàng ngày</span>
                        </p>
                    </div>

                    <div className="bg-tan p-4 rounded-xl shadow-lg overflow-hidden">
                        <h2 className="text-3xl font-semibold text-charcoalCoffee mb-4 text-center">Bản Đồ</h2>
                        <div className="aspect-w-16 aspect-h-9 w-full rounded-md overflow-hidden">
                            {/* Google Maps Embed Placeholder */}
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d951.7117914593903!2d105.70780285991061!3d18.528419177201577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3139cb0042f62151%3A0x863424f7228d0e6a!2zR-G7mSBDYWbDqQ!5e0!3m2!1sen!2s!4v1754841936869!5m2!1sen!2s"
                                width="100%"
                                height="450"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="rounded-md"
                                title="Bản đồ quán cafe"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>

            {showSuccessModal && (
                <SuccessModal
                    message="Yêu cầu đặt bàn của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ lại sớm nhất."
                    onClose={() => setShowSuccessModal(false)}
                />
            )}
        </section>
    );
};

// Ensure Tailwind CSS is loaded (usually in public/index.html or main entry)
// This script is placed here for direct canvas compatibility
const TailwindCSS = () => <script src="https://cdn.tailwindcss.com"></script>;

// Define custom Tailwind colors and font family
// This configuration needs to be outside the React component tree
// and typically goes into a tailwind.config.js file or inline for Canvas
const TailwindConfig = () => (
    <script
        dangerouslySetInnerHTML={{
            __html: `
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            saddleBrown: '#8B4513', // Gỗ đậm
            sienna: '#A0522D',     // Nâu đất
            tan: '#D2B48C',        // Nâu be nhạt
            coffee: '#6F4E37',     // Nâu cà phê
            wheat: '#F5DEB3',      // Kem nhạt cho nền
            charcoalCoffee: '#4A2C2A', // Nâu đen cho chữ
          },
          fontFamily: {
            inter: ['Inter', 'sans-serif'], // Phông chữ ấm áp, mặc định Inter
            serif: ['Georgia', 'serif'], // Có thể dùng thêm font serif cho tiêu đề
          },
        }
      }
    }
  `
        }}
    ></script>
);

export default function Home() {
    return (
        <>
            <TailwindCSS />
            <TailwindConfig />
            <App />
        </>
    );
}
