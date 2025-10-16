export class GuidesSchema {
  public url: string = '';
  public title: string = '';
  public image: string = '';
  public datePublished: string = '';
  public dateModified: string = '';
  public description: string = ''; // Added description property
  public imageAlt: string = ''; // Alt text for social media
  public tags: string[] = []; // Article tags for Open Graph

  render(): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': this.url,
      },
      headline: this.title,
      description: this.description, // Added description to schema
      image: null,
      datePublished: this.datePublished,
      dateModified: null,
      author: {
        '@type': 'Person',
        name: 'Greg Grothaus',
      },
      publisher: {
        '@type': 'Organization',
        name: 'SSA.Tools',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ssa.tools/laptop-piggybank.jpg',
        },
      },
    };
    // Optional Fields:
    if (this.image) {
      schema.image = [this.image];
    }
    if (this.dateModified) {
      schema.dateModified = this.dateModified;
    }
    return (
      `<script type="application/ld+json">` +
      JSON.stringify(schema) +
      `</script>`
    );
  }

  renderSocialMeta(): string {
    let meta = '';

    // Open Graph / Facebook
    meta += `<meta property="og:type" content="article" />`;
    if (this.url) {
      meta += `<meta property="og:url" content="${this.url}" />`;
    }
    if (this.title) {
      meta += `<meta property="og:title" content="${this.title}" />`;
    }
    if (this.description) {
      meta += `<meta property="og:description" content="${this.description}" />`;
    }
    if (this.image) {
      const fullImageUrl = this.image.startsWith('http')
        ? this.image
        : `https://ssa.tools${this.image}`;
      meta += `<meta property="og:image" content="${fullImageUrl}" />`;
      meta += `<meta property="og:image:width" content="1200" />`;
      meta += `<meta property="og:image:height" content="630" />`;
    }
    meta += `<meta property="og:site_name" content="SSA.tools" />`;
    if (this.datePublished) {
      meta += `<meta property="article:published_time" content="${this.datePublished}" />`;
    }
    if (this.dateModified) {
      meta += `<meta property="article:modified_time" content="${this.dateModified}" />`;
    }
    meta += `<meta property="article:author" content="SSA.tools" />`;
    meta += `<meta property="article:section" content="Social Security" />`;

    // Add tags if provided
    this.tags.forEach((tag) => {
      meta += `<meta property="article:tag" content="${tag}" />`;
    });

    // Twitter Card
    meta += `<meta name="twitter:card" content="summary_large_image" />`;
    if (this.url) {
      meta += `<meta name="twitter:url" content="${this.url}" />`;
    }
    if (this.title) {
      meta += `<meta name="twitter:title" content="${this.title}" />`;
    }
    if (this.description) {
      meta += `<meta name="twitter:description" content="${this.description}" />`;
    }
    if (this.image) {
      const fullImageUrl = this.image.startsWith('http')
        ? this.image
        : `https://ssa.tools${this.image}`;
      meta += `<meta name="twitter:image" content="${fullImageUrl}" />`;
    }
    if (this.imageAlt) {
      meta += `<meta name="twitter:image:alt" content="${this.imageAlt}" />`;
    }

    return meta;
  }
}
