
Template.quipsView.helpers({
  quips: function() {
    return Quips.find({}, {
      sort: {
        createdAt: 1
      }
    });
  },
  areMoreQuips: function() {
    return quipsController.areMoreQuips();
  },
  isActive: function(id) {
    return id === scrollList.activeElementId();
  },
  areEditing: function(id) {
    return quipsController.areEditing()
      && id === scrollList.activeElementId();
  },
  searchPattern: function() {
    var tagSearch = quipsController.tagSearch();
    var result = [
      tagSearch ? '#' + tagSearch : null, 
      quipsController.searchPattern()]
      .join(' ')
      .trim();
    return result.length ? result : null;
  }
});