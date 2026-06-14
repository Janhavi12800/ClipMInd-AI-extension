interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search your memory…' }: SearchBarProps) {
  return (
    <div className="search-bar">
      <span className="search-bar__icon">🔍</span>
      <input
        className="cm-input search-bar__input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className="search-bar__clear" onClick={() => onChange('')} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}

interface FilterBarProps {
  category: string;
  type: string;
  sort: string;
  onCategoryChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onSortChange: (v: string) => void;
  categories: string[];
}

export function FilterBar({
  category,
  type,
  sort,
  onCategoryChange,
  onTypeChange,
  onSortChange,
  categories,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <select className="cm-select" value={type} onChange={(e) => onTypeChange(e.target.value)}>
        <option value="all">All Types</option>
        <option value="text">Text</option>
        <option value="image">Image</option>
        <option value="page">Page</option>
      </select>
      <select className="cm-select" value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="all">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select className="cm-select" value={sort} onChange={(e) => onSortChange(e.target.value)}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  );
}
