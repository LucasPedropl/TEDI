const supabase = require('../config/supabase');

const getNextId = async (tableName, idColumn) => {
  const { data, error } = await supabase
    .from(tableName)
    .select(idColumn)
    .order(idColumn, { ascending: false })
    .limit(1);

  if (error) throw error;

  const lastRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
  const lastValue = lastRow ? Number(lastRow[idColumn]) || 0 : 0;

  return lastValue + 1;
};

module.exports = {
  getNextId,
};
