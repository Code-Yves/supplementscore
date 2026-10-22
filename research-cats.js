/* One source for research-category names and the one-line description
   under each name. The homepage Research menu and the research page
   both read this. Do not copy the lines anywhere else. */
(function (root) {
  var CATS = [
    { id: 'all', label: 'All', blurb: 'Every article in the research library' },
    { id: 'quickread', label: 'Top 10 Lists', blurb: 'Ranked lists for a common question' },
    { id: 'guide', label: 'Guide', blurb: 'How to choose, dose, and compare supplements' },
    { id: 'breakthrough', label: 'Breakthrough', blurb: 'New findings that could change the advice' },
    { id: 'kids', label: 'Kids', blurb: 'Doses and safety for children and teens' },
    { id: 'myth', label: 'Reality Check', blurb: 'Popular claims checked against the trials' },
    { id: 'safety', label: 'Safety Alert', blurb: 'Harms, interactions, and what to avoid' },
    { id: 'research-update', label: 'Research Update', blurb: 'Newer trials that update this research question' },
    { id: 'condition', label: 'Condition', blurb: 'What the trials support for a single condition' },
    { id: 'stack', label: 'Stack', blurb: 'Several supplements combined for a shared goal' }
  ];
  var byId = {};
  CATS.forEach(function (cat) { byId[cat.id] = cat; });
  root.SS_RESEARCH_CATS = byId;
})(window);
