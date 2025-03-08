/**
 * Filters an array of strings or objects based on the query, matching items that start with the query.
 *
 * @param {Array} data - The array of strings, numbers, or objects to search through.
 * @param {string|number} query - The search query.
 * @param {Function} [accessor] - Optional function to access the searchable string or number from an object.
 * @param {Function} [idAccessor] - Optional function to access the ID from an object.
 * @returns {Array} Filtered results as objects with `id` and `value`, or an empty array if the query is empty.
 */
export const searchData = (
    data,
    query,
    accessor = (item) => item,
    idAccessor = (item) => item.id
  ) => {
    if (!query?.toString().trim()) return []; // Return empty array if query is empty or whitespace
    if (!Array.isArray(data)) return []; // Return empty array if data is not an array

    const lowerCaseQuery = query.toString().toLowerCase();

    return data
      .filter((item) => {
        try {
          const value = accessor(item);

          // Skip undefined, null, or invalid values
          if (value == null) return false;

          // 将值转换为字符串进行比较
          let stringValue;
          if (typeof value === 'string') {
            stringValue = value.toLowerCase();
          } else if (typeof value === 'number') {
            stringValue = value.toString();
          } else if (Array.isArray(value)) {
            // 如果是数组，将所有元素连接成字符串
            stringValue = value.join(' ').toLowerCase();
          } else if (typeof value === 'object') {
            // 如果是对象，将所有值连接成字符串
            stringValue = Object.values(value).join(' ').toLowerCase();
          } else {
            // 其他类型转换为字符串
            stringValue = String(value).toLowerCase();
          }

          return stringValue.includes(lowerCaseQuery); // 使用 includes 而不是 startsWith 以提高匹配灵活性
        } catch (error) {
          console.warn('Error processing search item:', error);
          return false;
        }
      })
      .map((item) => {
        try {
          return {
            id: idAccessor(item),
            value: accessor(item)
          };
        } catch (error) {
          console.warn('Error mapping search result:', error);
          return null;
        }
      })
      .filter(Boolean); // 移除任何 null 结果
  };