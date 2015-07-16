
scrollList = {};

scrollList.SCROLL_ITEM_SELECTOR = '.scroll-item';

scrollList.initialize = function() {
    $(window).bind('mousewheel', function(event) {
      if (event.originalEvent.wheelDelta >= 0) {
          scrollList.prev();
      }
      else {
          scrollList.next();
      }
      event.preventDefault();
  });
}

scrollList.activeElementId = function(id){
  if(id == null){
    return Session.get('activeElementId');
  }
  Session.set('activeElementId', id);
}

scrollList.activeElement = function(el) {
  if(el){
    scrollList.activeElementId(el.attr('id'));
  }
  else{
    var activeId = scrollList.activeElementId();
    return activeId && $('#' + activeId);
  }
}

scrollList.next = function() {
  var active = scrollList.activeElement();
  var next = active && active.next(scrollList.SCROLL_ITEM_SELECTOR);
  if(!next){
    return false;
  }
  var id = next.attr('id');
  if(id){
    scrollList.activeElementId(id);
    return id;
  }
}

scrollList.prev = function() {
  var active = scrollList.activeElement();
  var prev = active && active.prev(scrollList.SCROLL_ITEM_SELECTOR);
  if(!prev){
    return false;
  }
  var id = prev.attr('id');
  if(id){
    scrollList.activeElementId(id);
    return id;
  }
}

scrollList.get = function(id) {
  if (!id){
    return null;
  }
  return $('#' + id);
}

scrollList.getNext = function(id) {
  var current = scrollList.get(id);
  return current && current.next(scrollList.SCROLL_ITEM_SELECTOR);
}

scrollList.getPrev = function(id) {
  var current = scrollList.get(id);
  return current && current.prev(scrollList.SCROLL_ITEM_SELECTOR);
}

scrollList.updateScroll = function(el) {
  var active = scrollList.activeElement();
  if(active){
    scrollList.scrollTo(active);
  }  
}

scrollList.scrollToId = function(id) {
  if(!id){
    return;
  }
  scrollList.scrollTo(scrollList.get(id));
}

scrollList.scrollTo = function(el) {
  if(!el){
    return;
  }

  var elOffset = el.offset() && el.offset().top || 0;
  var elHeight = el.height();
  var windowHeight = $(window).height();
  var offset;

  if (elHeight < windowHeight) {
    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
  }
  else {
    offset = elOffset;
  }

  $('html, body').animate({scrollTop:offset}, 50);
}
