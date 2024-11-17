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
    if (!query.toString().trim()) return []; // Return empty array if query is empty or whitespace

    const lowerCaseQuery = query.toString().toLowerCase(); // Convert query to string for comparison
    return data
      .filter((item) => {
        const value = accessor(item);

        // Skip undefined or null values
        if (value === undefined || value === null) return false;

        // Convert value to string for comparison
        const stringValue =
          typeof value === "number" ? value.toString() : value.toLowerCase();

        return stringValue.startsWith(lowerCaseQuery); // Match items that start with the query
      })
      .map((item) => ({
        id: idAccessor(item), // Include the ID
        value: accessor(item), // Include the matched value
      }));
  };