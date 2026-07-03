const { Page } = require('../models');
const AppError = require('../utils/appError');

// Get all pages (Admin only)
exports.getAllPages = async (req, res, next) => {
  try {
    const pages = await Page.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({
      status: 'success',
      data: pages
    });
  } catch (error) {
    next(error);
  }
};

// Get single page by slug (Public & Admin)
exports.getPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({
      where: { slug }
    });

    if (!page) {
      return next(new AppError(`Page with slug '${slug}' not found`, 404));
    }

    // If it's a public request, ensure the page is active
    const isPublicRequest = !req.user;
    if (isPublicRequest && page.status !== 'Active') {
      return next(new AppError('Page is currently inactive', 403));
    }

    res.status(200).json({
      status: 'success',
      data: page
    });
  } catch (error) {
    next(error);
  }
};

// Create a new page (Admin only)
exports.createPage = async (req, res, next) => {
  try {
    const { title, slug, contentHtml, contentReact, metaDescription, status } = req.body;

    if (!title || !slug) {
      return next(new AppError('Title and slug are required fields', 400));
    }

    // Check slug uniqueness
    const existingPage = await Page.findOne({ where: { slug } });
    if (existingPage) {
      return next(new AppError('A page with this slug already exists', 400));
    }

    const newPage = await Page.create({
      title,
      slug: slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, ''),
      contentHtml: contentHtml || '<div></div>',
      contentReact: contentReact || '',
      metaDescription,
      status: status || 'Active'
    });

    res.status(201).json({
      status: 'success',
      data: newPage
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing page (Admin only)
exports.updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug, contentHtml, contentReact, metaDescription, status } = req.body;

    const page = await Page.findByPk(id);
    if (!page) {
      return next(new AppError('Page not found', 404));
    }

    // If slug is being updated, verify uniqueness
    if (slug && slug !== page.slug) {
      const formattedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
      const existingPage = await Page.findOne({ where: { slug: formattedSlug } });
      if (existingPage) {
        return next(new AppError('A page with this slug already exists', 400));
      }
      page.slug = formattedSlug;
    }

    if (title) page.title = title;
    if (contentHtml !== undefined) page.contentHtml = contentHtml;
    if (contentReact !== undefined) page.contentReact = contentReact;
    if (metaDescription !== undefined) page.metaDescription = metaDescription;
    if (status) page.status = status;

    await page.save();

    res.status(200).json({
      status: 'success',
      data: page
    });
  } catch (error) {
    next(error);
  }
};

// Delete a page (Admin only)
exports.deletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await Page.findByPk(id);

    if (!page) {
      return next(new AppError('Page not found', 404));
    }

    await page.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
