import UilBrushAlt from '~icons/uil/brush-alt'
// import UilChartBar from '~icons/uil/chart-bar'
import UilCreateDashboard from '~icons/uil/create-dashboard'
import UilPostcard from '~icons/uil/postcard'
import UilTwitterAlt from '~icons/uil/twitter-alt'
import UilUserCircle from '~icons/uil/user-circle'
// Icon for analytics: choose a generic chart icon.  If this import fails in your
// environment, replace `chart-bar` with another Unicons icon name, such as
// `create-dashboard`.
// Icon for Gmail integration.  If this import fails, replace `google` with
// another Unicons icon name such as `envelope`.

export const main = [
  {
    name: 'Basic',
    path: '/basic',
    icon: UilUserCircle,
  },
  {
    name: 'Social',
    path: '/social',
    icon: UilTwitterAlt,
  },
  {
    name: 'Options',
    path: '/options',
    icon: UilBrushAlt,
  },
  {
    name: 'Addons',
    path: '/addons',
    icon: UilCreateDashboard,
  },
  {
    name: 'Templates',
    path: '/templates',
    icon: UilPostcard,
  },
  // New menu item for pixel analytics.  This flag indicates the item
  // should only be visible to authenticated users.  The Nav component
  // can use `requiresUser` to filter items.
  // {
  //   name: 'Analytics',
  //   path: '/analytics',
  //   icon: UilChartBar,
  //   requiresUser: true,
  // },
]
