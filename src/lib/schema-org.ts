export class GuidesSchema {
  public url: string = '';
  public title: string = '';
  public image: string = '';
  public datePublished: string = '';
  public dateModified: string = '';

  render(): string {
    let schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': this.url,
      },
      headline: this.title,
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
        `<script type="application/ld+json">` + JSON.stringify(schema) +
        `</script>`);
  }
}
