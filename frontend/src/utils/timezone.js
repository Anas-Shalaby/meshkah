// يحوّل 08:00 و 20:00 بتوقيت الرياض إلى عرض محلي للمستخدم
export function getLocalTimesForRiyadh() {
  try {
    const riyadhTz = "Asia/Riyadh";
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    const toLocal = (timeStr24) => {
      // نبني تاريخ في الرياض عند التوقيت المحدد ثم نعرضه في توقيت المتصفح
      const [h, m] = timeStr24.split(":");
      const riyadhDate = new Date(
        new Date(
          new Date(`${dateStr}T00:00:00`).toLocaleString("en-US", {
            timeZone: riyadhTz,
          })
        )
      );
      riyadhDate.setHours(Number(h), Number(m), 0, 0);
      // صياغة محلية للمستخدم
      return riyadhDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return {
      morningLocal: toLocal("08:00"),
      eveningLocal: toLocal("20:00"),
    };
  } catch (_) {
    return { morningLocal: "08:00", eveningLocal: "20:00" };
  }
}
