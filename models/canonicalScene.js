export const CanonicalScene = {
  // identity
  sourceSite: null,
  sourceUrl: null,
  sourcePerformer: { id: null, slug: null },

  sceneId: null,
  detailUrl: null,

  movie: {
    id: null,
    url: null,
    title: null,
    productionYear: null,
  },

  series: {
    id: null,
    title: null,
  },

  // titles
  title: null,
  subtitle: null,
  studio: null,

  // dates & duration
  releaseDate: null,
  videoLength: {
    seconds: null,
    display: null,
  },

  // people
  directors: [],

  performers: [
    {
      name: null,
      attributes: {
        age: [],
        body: [],
        clothing: [],
        ethnicity: [],
        genitals: [],
        hair: [],
      },
    },
  ],

  // content classification
  acts: [],
  settings: [],
  themes: [],
  attributes: [],

  // media
  thumbnails: {
    small: null,
    medium: null,
    large: null,
    original: null,
  },

  preview: {
    low: null,
    high: null,
  },

  trailer: {
    iframeUrl: null,
  },

  fullMovieUrl: null,
}
