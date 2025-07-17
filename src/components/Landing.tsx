import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MessageCircle,
  DollarSign,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar"
import { useCivicUser } from "../hooks/useCivicUser";
import toast from "react-hot-toast";
// import { usePaidConnections } from "../hooks/usePaidConnections";

export default function LandingPage() {
  // const { data: paidConnections } = usePaidConnections();
  // console.log("Paid connections:", paidConnections);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("Tech");
  const [activeFeature, setActiveFeature] = useState(0);
  const { isAuthenticated } = useCivicUser();
  const navigate = useNavigate();

  const goToCreatorsPage = () => {
    if (!isAuthenticated) {
      toast.error("You need to sign in to connect with creators! Please sign in to continue.", { position: "bottom-right" });
      return;
    }
    navigate("/creators");
  };

  const goToCreatorSignupPage = () => {
    navigate("/creator/signup");
  };

  const categories = ["Tech", "Career", "Development", "IT", "Product"];

  const creator = {
    name: "Vijay Kv",
    description:
      "Connect work to Luna to learn about various technologies and explore the field of freelancing",
    image:
      "https://cdn.prod.website-files.com/643ed195cb374047b812e17a/645d20a728f43ef1461d1a31_young-guy-creating-video-1024x682.jpeg",
  };

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const features = [
    {
      title: "Prioritized Direct Messages",
      description:
        "Connect with creators through a streamlined messaging system.",
      icon: <MessageCircle className="h-6 w-6" />,
    },
    {
      title: "Crypto Payments",
      description: "Securely pay for services using cryptocurrency.",
      icon: <DollarSign className="h-6 w-6" />,
    },
    {
      title: "Efficient Communication",
      description: "Manage audience interactions effectively.",
      icon: <Zap className="h-6 w-6" />,
    },
  ];

  const faqItems = [
    {
      question: "What is InTouch?",
      answer:
        "InTouch is a platform that connects creators with their audience, allowing for personalized interactions and knowledge sharing.",
    },
    {
      question: "How do I become a creator on InTouch?",
      answer:
        "To become a creator, click on the \"Become a creator\" button and follow the registration process. You'll need to provide information about your expertise and the type of content you'll be sharing.",
    },
    {
      question: "Is InTouch free to use?",
      answer:
        "InTouch is free for users to browse and connect with creators. Creators may charge for their services (1%), and InTouch takes a small percentage of these transactions.",
    },
    {
      question: "How do I book a session with a creator?",
      answer:
        "Browse through the creator profiles, select the one you're interested in, and use their booking system to schedule a session. Payment is handled securely through our platform.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fffdf4] font-sans text-gray-800 transition-colors duration-300">
      <NavBar
        goToCreatorSignupPage={goToCreatorSignupPage}
      />

      <main className="container mx-auto px-4 lg:py-28 py-12 ">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0 ">
          <div className="lg:w-1/2">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Connect with your <br />
              <span className="text-5xl md:text-6xl text-orange-500 relative">
                favourite creators
                <svg
                  className="absolute w-full h-3 bottom-0 left-0"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,0 Q150,12 300,0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
              </span>
              <br />
              like never before
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 mb-8"
            >
              Build valuable connections and gain insights. <br />
              Engage with creators who inspire and help you grow.
            </motion.p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300"
                onClick={goToCreatorsPage}
              >
                Get connected
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-100 transition duration-300"
                onClick={goToCreatorSignupPage}
              >
                Become a creator
              </motion.button>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              src="https://cdn.prod.website-files.com/643ed195cb374047b812e17a/645d20a728f43ef1461d1a31_young-guy-creating-video-1024x682.jpeg"
              alt="Side hustle illustration"
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-md"
            >
              <p className="font-semibold">
                Vijay created a side hustle
              </p>
              <p className="text-sm text-gray-600">
                that can help you into freelancing
              </p>
            </motion.div>
          </div>
        </div>

        <section className="mt-24 ">
          <h3 className="text-3xl font-bold text-center mb-8">
            Find your favourite creators
          </h3>
          <section className="py-12 bg-white rounded-3xl shadow-lg">
            <div className="container mx-auto px-4">
              <div className="mb-8 overflow-x-auto">
                <div className="flex space-x-2 min-w-max">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeCategory === category
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="mt-12 flex flex-col lg:flex-row items-start lg:items-center justify-between">
                <div className="lg:w-1/2 mb-8 lg:mb-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="aspect-video rounded-lg overflow-hidden shadow-xl"
                  >
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
                <div className="lg:w-1/2 lg:pl-12">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
                  >
                    {creator.name}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-lg md:text-xl text-gray-600 mb-8"
                  >
                    {creator.description}
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="px-8 py-3 bg-gray-900 text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Connect with him
                  </motion.button>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="mt-24 py-16 bg-white rounded-3xl shadow-lg">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className={`p-6 rounded-lg transition-all duration-300 cursor-pointer ${
                      activeFeature === index
                        ? "bg-orange-100 shadow-md"
                        : "bg-gray-50 hover:bg-orange-50"
                    }`}
                    onClick={() => setActiveFeature(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-500 p-3 rounded-full text-white">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="relative">
                <div className="bg-gray-100 rounded-lg p-6">
                  <h3 className="text-2xl font-bold mb-2">
                    Experience InTouch
                  </h3>
                  <p className="text-gray-600 mb-4">
                    See how our platform works
                  </p>
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <iframe
                      width="560"
                      height="315"
                      src="https://www.youtube.com/embed/n582SSicHfc?si=19a9VeON3JkDmplZ"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-orange-500 text-white rounded-full text-lg font-medium hover:bg-orange-600 transition-colors inline-flex items-center"
              >
                Join InTouch Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <h3 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 pb-4"
                >
                  <button
                    className="flex justify-between items-center w-full text-left"
                    onClick={() =>
                      setExpandedFaq(expandedFaq === index ? null : index)
                    }
                  >
                    <span className="text-lg font-medium text-gray-900">
                      {item.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 text-gray-600"
                      >
                        {item.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 mt-24 py-12 transition-colors duration-300">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            &copy; 2025 InTouch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
