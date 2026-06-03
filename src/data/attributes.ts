export const attributes = {
  avatar: {
    min: 50,
    max: 150,
    roundness: [
      { label: 'Rond', value: 'round' },
      { label: 'Carré', value: 'square' },
      { label: 'Coins arrondis', value: 'rounded-corner' },
    ],
  },
  font: {
    size: [
      { label: 'Petite', value: 11 },
      { label: 'Moyenne', value: 12 },
      { label: 'Grande', value: 13 },
    ],
    family: [
      {
        label: 'Sans empattement',
        options: [
          { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
          { label: 'Comic Sans MS', value: '\'Comic Sans MS\', sans-serif' },
          { label: 'Lucida Grande', value: '\'Lucida Grande\', sans-serif' },
          { label: 'Tahoma', value: 'Tahoma, sans-serif' },
          { label: 'Trebuchet MS', value: '\'Trebuchet MS\', sans-serif' },
          { label: 'Verdana', value: 'Verdana, sans-serif' },
        ],
      },
      {
        label: 'Chasse fixe',
        options: [
          {
            label: 'Courier New',
            value: '"Courier New", Courier, monospace',
          },
          {
            label: 'Lucida Console',
            value: '"Lucida Console", Monaco, monospace',
          },
        ],
      },
    ],
  },
  separator: {
    options: [
      { label: '/', value: '/' },
      { label: '|', value: '|' },
      { label: 'à', value: 'at' },
      { label: 'Nouvelle ligne', value: 'br' },
    ],
  },
  types: [
    { label: 'Texte', value: 'text' },
    { label: 'E-mail', value: 'email' },
    { label: 'Téléphone', value: 'phone' },
    { label: 'Lien', value: 'link' },
  ],
}
