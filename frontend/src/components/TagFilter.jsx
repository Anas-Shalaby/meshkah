export default function TagFilter({ tags, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {tags.map((tag) => (
        <button
          key={tag.value}
          className={`px-3 py-1 rounded-full border ${
            selected === tag.value
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-green-700 border-green-200"
          } transition`}
          onClick={() => onSelect(tag.value)}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
