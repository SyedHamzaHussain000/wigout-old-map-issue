import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a route from outside of a component.
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.log('NavigationRef not ready, retrying in 500ms...');
    setTimeout(() => {
      navigate(name, params);
    }, 500);
  }
}
