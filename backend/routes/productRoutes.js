import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import { isAuth, isAdmin } from '../utils.js';
import logger from '../logger.js';


const productRouter = express.Router();

productRouter.get('/', async (req, res) => {
  logger.info('Fetching all products');
  const products = await Product.find();
  logger.info(`Fetched ${products.length} products`);
  res.send(products);
});


productRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    logger.info('Creating a new product', { user: req.user._id });
    const newProduct = new Product({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: '/images/p1.jpg',
      price: 0,
      category: 'sample category',
      brand: 'sample brand',
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });
    const product = await newProduct.save();
    logger.info('Product created', { productId: product._id });
    res.send({ message: 'Product Created', product });
  })
);

productRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    logger.info('Updating product', { productId });
    const product = await Product.findById(productId);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.image = req.body.image;
      product.images = req.body.images;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      await product.save();
      logger.info('Product updated', { productId });
      res.send({ message: 'Product Updated' });
    } else {
      logger.warn('Product not found for update', { productId });
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);


productRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    logger.info('Deleting product', { productId });
    const product = await Product.findById(productId);
    if (product) {
      await product.remove();
      logger.info('Product deleted', { productId });
      res.send({ message: 'Product Deleted' });
    } else {
      logger.warn('Product not found for deletion', { productId });
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);


productRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    logger.info('Adding a review', { productId, user: req.user.name });
    const product = await Product.findById(productId);
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        logger.warn('User already submitted a review', { productId, user: req.user.name });
        return res.status(400).send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) / product.reviews.length;
      const updatedProduct = await product.save();
      logger.info('Review added', { productId, review: review });
      res.status(201).send({
        message: 'Review Created',
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews,
        rating: product.rating,
      });
    } else {
      logger.warn('Product not found for review', { productId });
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);


const PAGE_SIZE = 3;

productRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const products = await Product.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Product.countDocuments();
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    logger.info('Searching products', { query: req.query });
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? { name: { $regex: searchQuery, $options: 'i' } }
        : {};
    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter =
      rating && rating !== 'all'
        ? { rating: { $gte: Number(rating) } }
        : {};
    const priceFilter =
      price && price !== 'all'
        ? { price: { $gte: Number(price.split('-')[0]), $lte: Number(price.split('-')[1]) } }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });

    logger.info('Search results fetched', {
      query,
      count: countProducts,
      page,
    });

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);
  })
);

productRouter.get('/slug/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});
productRouter.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});

export default productRouter;
