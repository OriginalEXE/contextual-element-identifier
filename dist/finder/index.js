"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evaluateXPath = exports.getMultipleSiblingsElements = exports.getSiblingsElements = exports.findElementsWithPredicate = exports.findElements = exports.getElement = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _xpath = require("../xpath");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var getElement = function getElement(identifier) {
  var document = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.document;

  var last = _lodash.default.last(identifier.absolute);

  if (!last) {
    return undefined;
  }

  var xpath = (0, _xpath.toAbsoluteXPath)(identifier);
  var result = evaluateXPath(xpath, document, document);

  if (result.length === 1 && isMatchedAttributes(result[0], last)) {
    return result[0];
  } else {
    return undefined;
  }
};

exports.getElement = getElement;

var findElements = function findElements(identifier) {
  var document = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.document;

  var last = _lodash.default.last(identifier.absolute);

  if (!last) {
    return [];
  }

  var strictElement = getElement(identifier, document);

  if (strictElement) {
    return [strictElement];
  }

  var uniqueXPath = (0, _xpath.toUniqueXPath)(identifier);
  var uniqueResult = evaluateXPath(uniqueXPath, document, document);
  var uniqueMatched = uniqueResult.filter(function (e) {
    return isMatchedAttributes(e, last);
  });

  if (uniqueMatched.length === 1) {
    return uniqueMatched;
  }

  var elements = [];
  var fragments = [];

  for (var i = 0; i < identifier.absolute.length; i++) {
    var fragment = identifier.absolute[identifier.absolute.length - 1 - i];
    fragments = [fragment].concat(_toConsumableArray(fragments));
    var xpath = (0, _xpath.greedyXPathFromFragments)(fragments);
    var elems = evaluateXPath(xpath, document, document);
    var matched = elems.filter(function (e) {
      return isMatchedAttributes(e, last);
    });

    if (matched.length === 1) {
      elements = matched;
      break;
    } else if (matched.length > 1) {
      elements = matched;
    }
  }

  return elements;
};

exports.findElements = findElements;

var findElementsWithPredicate = function findElementsWithPredicate(identifier, predicate) {
  var document = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : window.document;

  var last = _lodash.default.last(identifier.absolute);

  if (!last) {
    return [];
  }

  var uniqueXPath = (0, _xpath.toUniqueXPath)(identifier);
  var uniqueResult = evaluateXPath(uniqueXPath, document, document);
  var uniqueMatched = uniqueResult.filter(predicate);

  if (uniqueMatched.length === 1) {
    return uniqueMatched;
  }

  var elements = [];
  var fragments = [];

  for (var i = 0; i < identifier.absolute.length; i++) {
    var fragment = identifier.absolute[identifier.absolute.length - 1 - i];
    fragments = [fragment].concat(_toConsumableArray(fragments));
    var xpath = (0, _xpath.greedyXPathFromFragments)(fragments);
    var elems = evaluateXPath(xpath, document, document);
    var matched = elems.filter(predicate);

    if (matched.length === 1) {
      elements = matched;
      break;
    } else if (matched.length > 1) {
      elements = matched;
    }
  }

  return elements;
};

exports.findElementsWithPredicate = findElementsWithPredicate;

var getSiblingsElements = function getSiblingsElements(identifier) {
  var document = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.document;
  var identifiers = !Array.isArray(identifier) ? [identifier] : identifier;
  var lasts = identifiers.map(function (i) {
    return _lodash.default.last(i.absolute);
  }).filter(function (f) {
    return typeof f !== 'undefined';
  });

  if (lasts.length === 0) {
    return [];
  }

  var xpath = (0, _xpath.toSiblingsXPath)(identifier);
  var elements = evaluateXPath(xpath, document, document);
  return elements.filter(function (e) {
    return lasts.some(function (f) {
      return isMatchedAttributes(e, f);
    });
  });
};

exports.getSiblingsElements = getSiblingsElements;

var getMultipleSiblingsElements = function getMultipleSiblingsElements(identifiers) {
  var document = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.document;

  if (identifiers.length === 0) {
    return [];
  }

  if (identifiers.length === 1) {
    var result = getSiblingsElements(identifiers[0], document);
    return [result];
  }

  var ancestorXPath = (0, _xpath.toAncestorXPath)(identifiers);
  var ancestorElements = evaluateXPath(ancestorXPath, document, document);
  var elementsArray = identifiers.map(function (identifier) {
    return getSiblingsElements(identifier, document);
  });
  var maxLength = elementsArray.reduce(function (acc, current) {
    return current.length > acc ? current.length : acc;
  }, 0);

  if (ancestorElements.length === maxLength) {
    var grouped = ancestorElements.map(function (ancestor) {
      return elementsArray.map(function (elements) {
        return elements.find(function (e) {
          return (// tslint:disable-next-line
            ancestor.compareDocumentPosition(e) & 16
          );
        } //Node.DOCUMENT_POSITION_CONTAINED_BY
        );
      });
    });
    return _lodash.default.zip.apply(_lodash.default, _toConsumableArray(grouped));
  } else {
    return elementsArray;
  }
};

exports.getMultipleSiblingsElements = getMultipleSiblingsElements;

var isMatchedAttributes = function isMatchedAttributes(element, fragment) {
  return isMatchedId(element, fragment) && isMatchedClassNames(element, fragment) && isMatchedRoles(element, fragment);
};

var isMatchedId = function isMatchedId(element, fragment) {
  var id = element.id.length > 0 ? element.id : undefined;
  return fragment.id === id;
};

var isMatchedClassNames = function isMatchedClassNames(element, fragment) {
  var classNames = Array.from(element.classList);

  if (fragment.classNames.length === 0 && classNames.length === 0) {
    return true;
  }

  var intersected = _lodash.default.intersection(fragment.classNames, classNames);

  return intersected.length > 0;
};

var isMatchedRoles = function isMatchedRoles(element, fragment) {
  var roleString = element.getAttribute('role');
  var roles = roleString ? roleString.split(' ') : [];

  if (fragment.roles.length === 0 && roles.length === 0) {
    return true;
  }

  var intersected = _lodash.default.intersection(fragment.roles, roles);

  return intersected.length > 0;
};

var evaluateXPath = function evaluateXPath(xpath) {
  var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.document;
  var document = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : window.document;
  var result = document.evaluate(root === document && !/^\./.test(xpath) ? xpath : ".".concat(xpath), root, null, 7, // XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  null);
  var elements = [];

  for (var i = 0; i < result.snapshotLength; i++) {
    var node = result.snapshotItem(i);

    if (node && node.nodeType === 1) {
      // Node.ELEMENT_NODE
      elements.push(node);
    }
  }

  return elements;
};

exports.evaluateXPath = evaluateXPath;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9maW5kZXIvaW5kZXgudHMiXSwibmFtZXMiOlsiZ2V0RWxlbWVudCIsImlkZW50aWZpZXIiLCJkb2N1bWVudCIsIndpbmRvdyIsImxhc3QiLCJfIiwiYWJzb2x1dGUiLCJ1bmRlZmluZWQiLCJ4cGF0aCIsInJlc3VsdCIsImV2YWx1YXRlWFBhdGgiLCJsZW5ndGgiLCJpc01hdGNoZWRBdHRyaWJ1dGVzIiwiZmluZEVsZW1lbnRzIiwic3RyaWN0RWxlbWVudCIsInVuaXF1ZVhQYXRoIiwidW5pcXVlUmVzdWx0IiwidW5pcXVlTWF0Y2hlZCIsImZpbHRlciIsImUiLCJlbGVtZW50cyIsImZyYWdtZW50cyIsImkiLCJmcmFnbWVudCIsImVsZW1zIiwibWF0Y2hlZCIsImZpbmRFbGVtZW50c1dpdGhQcmVkaWNhdGUiLCJwcmVkaWNhdGUiLCJnZXRTaWJsaW5nc0VsZW1lbnRzIiwiaWRlbnRpZmllcnMiLCJBcnJheSIsImlzQXJyYXkiLCJsYXN0cyIsIm1hcCIsImYiLCJzb21lIiwiZ2V0TXVsdGlwbGVTaWJsaW5nc0VsZW1lbnRzIiwiYW5jZXN0b3JYUGF0aCIsImFuY2VzdG9yRWxlbWVudHMiLCJlbGVtZW50c0FycmF5IiwibWF4TGVuZ3RoIiwicmVkdWNlIiwiYWNjIiwiY3VycmVudCIsImdyb3VwZWQiLCJhbmNlc3RvciIsImZpbmQiLCJjb21wYXJlRG9jdW1lbnRQb3NpdGlvbiIsInppcCIsImVsZW1lbnQiLCJpc01hdGNoZWRJZCIsImlzTWF0Y2hlZENsYXNzTmFtZXMiLCJpc01hdGNoZWRSb2xlcyIsImlkIiwiY2xhc3NOYW1lcyIsImZyb20iLCJjbGFzc0xpc3QiLCJpbnRlcnNlY3RlZCIsImludGVyc2VjdGlvbiIsInJvbGVTdHJpbmciLCJnZXRBdHRyaWJ1dGUiLCJyb2xlcyIsInNwbGl0Iiwicm9vdCIsImV2YWx1YXRlIiwidGVzdCIsInNuYXBzaG90TGVuZ3RoIiwibm9kZSIsInNuYXBzaG90SXRlbSIsIm5vZGVUeXBlIiwicHVz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QUZkdUQsSUFFYyx1RUFGRDVELE1BQU0sQ0FBQ0QsUUFFTjtBQUFBLE1BRGRBLFFBQ2MsdUVBRE9DLE1BQU0sQ0FBQ0QsUUFDZDtBQUNkLE1BQU1PLE1BQU0sR0FBR1AsUUFBUSxDQUFDOEQsUUFBVCxDQUNiRCxJQUFJLEtBQUs3RCxRQUFULElBQXFCLENBQUMsTUFBTStELElBQU4sQ0FBV3pELEtBQVgsQ0FBdEIsR0FBMENBLEtBQTFDLGNBQXNEQSxLQUF0RCxDQURhLEVBRWJ1RCxJQUZhLEVBR2IsSUFIYSxFQUliLENBSmEsRUFJVjtBQUNILE1BTGEsQ0FBZjtBQVFBLE1BQU0zQyxRQUFtQixHQUFHLEVBQTVCOztBQUNBLE9BQUssSUFBSUUsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2IsTUFBTSxDQUFDeUQsY0FBM0IsRUFBMkM1QyxDQUFDLEVBQTVDLEVBQWdEO0FBQzlDLFFBQU02QyxJQUFJLEdBQUcxRCxNQUFNLENBQUMyRCxZQUFQLENBQW9COUMsQ0FBcEIsQ0FBYjs7QUFDQSxRQUFJNkMsSUFBSSxJQUFJQSxJQUFJLENBQUNFLFFBQUwsS0FBa0IsQ0FBOUIsRUFBaUM7QUFDL0I7QUFDQWpELE1BQUFBLFFBQVEsQ0FBQ2tELElBQVQsQ0FBY0gsSUFBZDtBQUNEO0FBQ0Y7O0FBRUQsU0FBTy9DLFFBQVA7QUFDRCxDQXZCTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7IEVsZW1lbnRJZGVudGlmaWVyLCBFbGVtZW50RnJhZ21lbnQgfSBmcm9tICcuLi9pZGVudGlmaWVyL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtcbiAgdG9BYnNvbHV0ZVhQYXRoLFxuICB0b1VuaXF1ZVhQYXRoLFxuICB0b1NpYmxpbmdzWFBhdGgsXG4gIHRvQW5jZXN0b3JYUGF0aCxcbiAgZ3JlZWR5WFBhdGhGcm9tRnJhZ21lbnRzLFxufSBmcm9tICcuLi94cGF0aCc7XG5cbmV4cG9ydCBjb25zdCBnZXRFbGVtZW50ID0gKFxuICBpZGVudGlmaWVyOiBFbGVtZW50SWRlbnRpZmllcixcbiAgZG9jdW1lbnQ6IERvY3VtZW50ID0gd2luZG93LmRvY3VtZW50XG4pOiBFbGVtZW50IHwgdW5kZWZpbmVkID0+IHtcbiAgY29uc3QgbGFzdCA9IF8ubGFzdChpZGVudGlmaWVyLmFic29sdXRlKTtcbiAgaWYgKCFsYXN0KSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHhwYXRoID0gdG9BYnNvbHV0ZVhQYXRoKGlkZW50aWZpZXIpO1xuICBjb25zdCByZXN1bHQgPSBldmFsdWF0ZVhQYXRoKHhwYXRoLCBkb2N1bWVudCwgZG9jdW1lbnQpO1xuXG4gIGlmIChyZXN1bHQubGVuZ3RoID09PSAxICYmIGlzTWF0Y2hlZEF0dHJpYnV0ZXMocmVzdWx0WzBdLCBsYXN0KSkge1xuICAgIHJldHVybiByZXN1bHRbMF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGZpbmRFbGVtZW50cyA9IChcbiAgaWRlbnRpZmllcjogRWxlbWVudElkZW50aWZpZXIsXG4gIGRvY3VtZW50OiBEb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuKTogRWxlbWVudFtdID0+IHtcbiAgY29uc3QgbGFzdCA9IF8ubGFzdChpZGVudGlmaWVyLmFic29sdXRlKTtcbiAgaWYgKCFsYXN0KSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3Qgc3RyaWN0RWxlbWVudCA9IGdldEVsZW1lbnQoaWRlbnRpZmllciwgZG9jdW1lbnQpO1xuICBpZiAoc3RyaWN0RWxlbWVudCkge1xuICAgIHJldHVybiBbc3RyaWN0RWxlbWVudF07XG4gIH1cblxuICBjb25zdCB1bmlxdWVYUGF0aCA9IHRvVW5pcXVlWFBhdGgoaWRlbnRpZmllcik7XG4gIGNvbnN0IHVuaXF1ZVJlc3VsdCA9IGV2YWx1YXRlWFBhdGgodW5pcXVlWFBhdGgsIGRvY3VtZW50LCBkb2N1bWVudCk7XG4gIGNvbnN0IHVuaXF1ZU1hdGNoZWQgPSB1bmlxdWVSZXN1bHQuZmlsdGVyKGUgPT4gaXNNYXRjaGVkQXR0cmlidXRlcyhlLCBsYXN0KSk7XG4gIGlmICh1bmlxdWVNYXRjaGVkLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiB1bmlxdWVNYXRjaGVkO1xuICB9XG5cbiAgbGV0IGVsZW1lbnRzOiBFbGVtZW50W10gPSBbXTtcbiAgbGV0IGZyYWdtZW50czogRWxlbWVudEZyYWdtZW50W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpZGVudGlmaWVyLmFic29sdXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZnJhZ21lbnQgPSBpZGVudGlmaWVyLmFic29sdXRlW2lkZW50aWZpZXIuYWJzb2x1dGUubGVuZ3RoIC0gMSAtIGldO1xuICAgIGZyYWdtZW50cyA9IFtmcmFnbWVudCwgLi4uZnJhZ21lbnRzXTtcbiAgICBjb25zdCB4cGF0aCA9IGdyZWVkeVhQYXRoRnJvbUZyYWdtZW50cyhmcmFnbWVudHMpO1xuICAgIGNvbnN0IGVsZW1zID0gZXZhbHVhdGVYUGF0aCh4cGF0aCwgZG9jdW1lbnQsIGRvY3VtZW50KTtcbiAgICBjb25zdCBtYXRjaGVkID0gZWxlbXMuZmlsdGVyKGUgPT4gaXNNYXRjaGVkQXR0cmlidXRlcyhlLCBsYXN0KSk7XG4gICAgaWYgKG1hdGNoZWQubGVuZ3RoID09PSAxKSB7XG4gICAgICBlbGVtZW50cyA9IG1hdGNoZWQ7XG4gICAgICBicmVhaztcbiAgICB9IGVsc2UgaWYgKG1hdGNoZWQubGVuZ3RoID4gMSkge1xuICAgICAgZWxlbWVudHMgPSBtYXRjaGVkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbGVtZW50cztcbn07XG5cbmV4cG9ydCBjb25zdCBmaW5kRWxlbWVudHNXaXRoUHJlZGljYXRlID0gKFxuICBpZGVudGlmaWVyOiBFbGVtZW50SWRlbnRpZmllcixcbiAgcHJlZGljYXRlOiAoZWxlbWVudDogRWxlbWVudCkgPT4gYm9vbGVhbixcbiAgZG9jdW1lbnQ6IERvY3VtZW50ID0gd2luZG93LmRvY3VtZW50XG4pOiBFbGVtZW50W10gPT4ge1xuICBjb25zdCBsYXN0ID0gXy5sYXN0KGlkZW50aWZpZXIuYWJzb2x1dGUpO1xuICBpZiAoIWxhc3QpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCB1bmlxdWVYUGF0aCA9IHRvVW5pcXVlWFBhdGgoaWRlbnRpZmllcik7XG4gIGNvbnN0IHVuaXF1ZVJlc3VsdCA9IGV2YWx1YXRlWFBhdGgodW5pcXVlWFBhdGgsIGRvY3VtZW50LCBkb2N1bWVudCk7XG4gIGNvbnN0IHVuaXF1ZU1hdGNoZWQgPSB1bmlxdWVSZXN1bHQuZmlsdGVyKHByZWRpY2F0ZSk7XG4gIGlmICh1bmlxdWVNYXRjaGVkLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiB1bmlxdWVNYXRjaGVkO1xuICB9XG5cbiAgbGV0IGVsZW1lbnRzOiBFbGVtZW50W10gPSBbXTtcbiAgbGV0IGZyYWdtZW50czogRWxlbWVudEZyYWdtZW50W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpZGVudGlmaWVyLmFic29sdXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZnJhZ21lbnQgPSBpZGVudGlmaWVyLmFic29sdXRlW2lkZW50aWZpZXIuYWJzb2x1dGUubGVuZ3RoIC0gMSAtIGldO1xuICAgIGZyYWdtZW50cyA9IFtmcmFnbWVudCwgLi4uZnJhZ21lbnRzXTtcbiAgICBjb25zdCB4cGF0aCA9IGdyZWVkeVhQYXRoRnJvbUZyYWdtZW50cyhmcmFnbWVudHMpO1xuICAgIGNvbnN0IGVsZW1zID0gZXZhbHVhdGVYUGF0aCh4cGF0aCwgZG9jdW1lbnQsIGRvY3VtZW50KTtcbiAgICBjb25zdCBtYXRjaGVkID0gZWxlbXMuZmlsdGVyKHByZWRpY2F0ZSk7XG4gICAgaWYgKG1hdGNoZWQubGVuZ3RoID09PSAxKSB7XG4gICAgICBlbGVtZW50cyA9IG1hdGNoZWQ7XG4gICAgICBicmVhaztcbiAgICB9IGVsc2UgaWYgKG1hdGNoZWQubGVuZ3RoID4gMSkge1xuICAgICAgZWxlbWVudHMgPSBtYXRjaGVkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbGVtZW50cztcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRTaWJsaW5nc0VsZW1lbnRzID0gKFxuICBpZGVudGlmaWVyOiBFbGVtZW50SWRlbnRpZmllciB8IEVsZW1lbnRJZGVudGlmaWVyW10sXG4gIGRvY3VtZW50OiBEb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuKTogRWxlbWVudFtdID0+IHtcbiAgY29uc3QgaWRlbnRpZmllcnMgPSAhQXJyYXkuaXNBcnJheShpZGVudGlmaWVyKSA/IFtpZGVudGlmaWVyXSA6IGlkZW50aWZpZXI7XG4gIGNvbnN0IGxhc3RzID0gaWRlbnRpZmllcnNcbiAgICAubWFwKGkgPT4gXy5sYXN0KGkuYWJzb2x1dGUpKVxuICAgIC5maWx0ZXIoZiA9PiB0eXBlb2YgZiAhPT0gJ3VuZGVmaW5lZCcpIGFzIEVsZW1lbnRGcmFnbWVudFtdO1xuXG4gIGlmIChsYXN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCB4cGF0aCA9IHRvU2libGluZ3NYUGF0aChpZGVudGlmaWVyKTtcbiAgY29uc3QgZWxlbWVudHMgPSBldmFsdWF0ZVhQYXRoKHhwYXRoLCBkb2N1bWVudCwgZG9jdW1lbnQpO1xuXG4gIHJldHVybiBlbGVtZW50cy5maWx0ZXIoZSA9PiB7XG4gICAgcmV0dXJuIGxhc3RzLnNvbWUoZiA9PiBpc01hdGNoZWRBdHRyaWJ1dGVzKGUsIGYpKTtcbiAgfSk7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0TXVsdGlwbGVTaWJsaW5nc0VsZW1lbnRzID0gKFxuICBpZGVudGlmaWVyczogRWxlbWVudElkZW50aWZpZXJbXVtdLFxuICBkb2N1bWVudDogRG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnRcbik6IChFbGVtZW50IHwgdW5kZWZpbmVkKVtdW10gPT4ge1xuICBpZiAoaWRlbnRpZmllcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgaWYgKGlkZW50aWZpZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGdldFNpYmxpbmdzRWxlbWVudHMoaWRlbnRpZmllcnNbMF0sIGRvY3VtZW50KTtcbiAgICByZXR1cm4gW3Jlc3VsdF07XG4gIH1cblxuICBjb25zdCBhbmNlc3RvclhQYXRoID0gdG9BbmNlc3RvclhQYXRoKGlkZW50aWZpZXJzKTtcbiAgY29uc3QgYW5jZXN0b3JFbGVtZW50cyA9IGV2YWx1YXRlWFBhdGgoYW5jZXN0b3JYUGF0aCwgZG9jdW1lbnQsIGRvY3VtZW50KTtcblxuICBjb25zdCBlbGVtZW50c0FycmF5ID0gaWRlbnRpZmllcnMubWFwKGlkZW50aWZpZXIgPT4ge1xuICAgIHJldHVybiBnZXRTaWJsaW5nc0VsZW1lbnRzKGlkZW50aWZpZXIsIGRvY3VtZW50KTtcbiAgfSk7XG5cbiAgY29uc3QgbWF4TGVuZ3RoID0gZWxlbWVudHNBcnJheS5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4ge1xuICAgIHJldHVybiBjdXJyZW50Lmxlbmd0aCA+IGFjYyA/IGN1cnJlbnQubGVuZ3RoIDogYWNjO1xuICB9LCAwKTtcblxuICBpZiAoYW5jZXN0b3JFbGVtZW50cy5sZW5ndGggPT09IG1heExlbmd0aCkge1xuICAgIGNvbnN0IGdyb3VwZWQgPSBhbmNlc3RvckVsZW1lbnRzLm1hcChhbmNlc3RvciA9PiB7XG4gICAgICByZXR1cm4gZWxlbWVudHNBcnJheS5tYXAoZWxlbWVudHMgPT4ge1xuICAgICAgICByZXR1cm4gZWxlbWVudHMuZmluZChcbiAgICAgICAgICBlID0+XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmVcbiAgICAgICAgICAgIGFuY2VzdG9yLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGUpICYgMTYgLy9Ob2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0NPTlRBSU5FRF9CWVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIF8uemlwKC4uLmdyb3VwZWQpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBlbGVtZW50c0FycmF5O1xuICB9XG59O1xuXG5jb25zdCBpc01hdGNoZWRBdHRyaWJ1dGVzID0gKFxuICBlbGVtZW50OiBFbGVtZW50LFxuICBmcmFnbWVudDogRWxlbWVudEZyYWdtZW50XG4pOiBib29sZWFuID0+IHtcbiAgcmV0dXJuIChcbiAgICBpc01hdGNoZWRJZChlbGVtZW50LCBmcmFnbWVudCkgJiZcbiAgICBpc01hdGNoZWRDbGFzc05hbWVzKGVsZW1lbnQsIGZyYWdtZW50KSAmJlxuICAgIGlzTWF0Y2hlZFJvbGVzKGVsZW1lbnQsIGZyYWdtZW50KVxuICApO1xufTtcblxuY29uc3QgaXNNYXRjaGVkSWQgPSAoZWxlbWVudDogRWxlbWVudCwgZnJhZ21lbnQ6IEVsZW1lbnRGcmFnbWVudCk6IGJvb2xlYW4gPT4ge1xuICBjb25zdCBpZCA9IGVsZW1lbnQuaWQubGVuZ3RoID4gMCA/IGVsZW1lbnQuaWQgOiB1bmRlZmluZWQ7XG4gIHJldHVybiBmcmFnbWVudC5pZCA9PT0gaWQ7XG59O1xuXG5jb25zdCBpc01hdGNoZWRDbGFzc05hbWVzID0gKFxuICBlbGVtZW50OiBFbGVtZW50LFxuICBmcmFnbWVudDogRWxlbWVudEZyYWdtZW50XG4pOiBib29sZWFuID0+IHtcbiAgY29uc3QgY2xhc3NOYW1lcyA9IEFycmF5LmZyb20oZWxlbWVudC5jbGFzc0xpc3QpO1xuICBpZiAoZnJhZ21lbnQuY2xhc3NOYW1lcy5sZW5ndGggPT09IDAgJiYgY2xhc3NOYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IGludGVyc2VjdGVkID0gXy5pbnRlcnNlY3Rpb24oZnJhZ21lbnQuY2xhc3NOYW1lcywgY2xhc3NOYW1lcyk7XG4gIHJldHVybiBpbnRlcnNlY3RlZC5sZW5ndGggPiAwO1xufTtcblxuY29uc3QgaXNNYXRjaGVkUm9sZXMgPSAoXG4gIGVsZW1lbnQ6IEVsZW1lbnQsXG4gIGZyYWdtZW50OiBFbGVtZW50RnJhZ21lbnRcbik6IGJvb2xlYW4gPT4ge1xuICBjb25zdCByb2xlU3RyaW5nID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKTtcbiAgY29uc3Qgcm9sZXMgPSByb2xlU3RyaW5nID8gcm9sZVN0cmluZy5zcGxpdCgnICcpIDogW107XG4gIGlmIChmcmFnbWVudC5yb2xlcy5sZW5ndGggPT09IDAgJiYgcm9sZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdCBpbnRlcnNlY3RlZCA9IF8uaW50ZXJzZWN0aW9uKGZyYWdtZW50LnJvbGVzLCByb2xlcyk7XG4gIHJldHVybiBpbnRlcnNlY3RlZC5sZW5ndGggPiAwO1xufTtcblxuZXhwb3J0IGNvbnN0IGV2YWx1YXRlWFBhdGggPSAoXG4gIHhwYXRoOiBzdHJpbmcsXG4gIHJvb3Q6IE5vZGUgPSB3aW5kb3cuZG9jdW1lbnQsXG4gIGRvY3VtZW50OiBEb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudFxuKTogRWxlbWVudFtdID0+IHtcbiAgY29uc3QgcmVzdWx0ID0gZG9jdW1lbnQuZXZhbHVhdGUoXG4gICAgcm9vdCA9PT0gZG9jdW1lbnQgJiYgIS9eXFwuLy50ZXN0KHhwYXRoKSA/IHhwYXRoIDogYC4ke3hwYXRofWAsXG4gICAgcm9vdCxcbiAgICBudWxsLFxuICAgIDcsIC8vIFhQYXRoUmVzdWx0Lk9SREVSRURfTk9ERV9TTkFQU0hPVF9UWVBFLFxuICAgIG51bGxcbiAgKTtcblxuICBjb25zdCBlbGVtZW50czogRWxlbWVudFtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0LnNuYXBzaG90TGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlID0gcmVzdWx0LnNuYXBzaG90SXRlbShpKTtcbiAgICBpZiAobm9kZSAmJiBub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAvLyBOb2RlLkVMRU1FTlRfTk9ERVxuICAgICAgZWxlbWVudHMucHVzaChub2RlIGFzIEVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbGVtZW50cztcbn07XG4iXX0=