import { defineConfig } from 'vitepress';
import { name, description, repository, license, author } from '../../package.json';
import typedocSidebar from '../api/typedoc-sidebar.json';

const cleanName = name.replace('@sgratzl/', '');

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: cleanName,
  description,
  base: `/${cleanName}/`,
  useWebFonts: false,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API', link: '/api/' },
      { text: 'Related Plugins', link: '/related' },
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Basic', link: '/examples/' },
          { text: 'Single Node', link: '/examples/single' },
          { text: 'Attributes', link: '/examples/attributes' },
          { text: 'Scriptable', link: '/examples/scriptable' },
          { text: 'Static Expansion', link: '/examples/static' },
          { text: 'Single Child', link: '/examples/singleChild' },
          { text: 'Horizontal Scale', link: '/examples/horizontal' },
          { text: 'Horizontal Scale (Reversed)', link: '/examples/horizontalReverse' },
          { text: 'Deep Hierarchy', link: '/examples/deep' },
          { text: 'Line Chart', link: '/examples/line' },
          { text: 'End Hierarchy', link: '/examples/endHierarchy' },
          { text: 'No Label', link: '/examples/noLabel' },
          //
        ],
      },
      {
        text: 'API',
        collapsed: true,
        items: typedocSidebar,
      },
    ],

    socialLinks: [{ icon: 'github', link: repository.url.replace('.git', '') }],

    footer: {
      message: `Released under the <a href="${repository.url.replace(
        '.git',
        ''
      )}/tree/main/LICENSE">${license} license</a>.`,
      copyright: `Copyright © 2019-present <a href="${author.url}">${author.name}</a>`,
    },

    editLink: {
      pattern: `${repository.url.replace('.git', '')}/edit/main/docs/:path`,
    },

    search: {
      provider: 'local',
    },
  },
});
