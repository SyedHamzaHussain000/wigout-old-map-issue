export const getCategory = data => {
  const types = data?.types || [];
  if (types.length === 0) return 'Place';
  const filterTypes = [
    'point_of_interest',
    'establishment',
    'food',
    'natural_feature',
    'street_address',
    'route',
  ];
  const meaningfulType = types.find(t => !filterTypes.includes(t)) || types[0];
  return meaningfulType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
