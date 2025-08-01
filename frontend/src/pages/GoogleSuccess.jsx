import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const GoogleSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      axios
        .post(
          `${import.meta.env.VITE_API_URL}/auth/google/callback`,
          { code },
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        )
        .then(() => {
          toast.success("تم ربط حسابك بجوجل بنجاح!");
          window.close();
        })
        .catch(() => {
          toast.error("حدث خطأ أثناء ربط جوجل");
          window.close();
        });
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <span className="text-lg">جاري ربط حسابك بجوجل...</span>
    </div>
  );
};

export default GoogleSuccess;
