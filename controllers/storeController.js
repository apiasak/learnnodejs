const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next){
    const isPhoto = file.mimetype.startsWith('image/')
    if(isPhoto) {
      next(null, true)
    } else {
      next({ message: 'That filetype is not allowed'}, false)
    }
  }
}

exports.homePage = (req, res) => {
  res.render('index')
};

exports.addStore = (req, res) => {
  res.render('editStore', {title: 'Add Store'})
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async (req, res, next) => {
  // check if there is no new file
  if(!req.file) {
    next() // skip to the next middleware
    return
  }
  
  const extension = req.file.mimetype.split('/')[1]
  req.body.photo = `${uuid.v4()}.${extension}`

  // resize
  const photo = await jimp.read(req.file.buffer)
  await photo.resize(800, jimp.AUTO)
  await photo.write(`./public/uploads/${req.body.photo}`)

  next()

}


exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}.`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStore = async (req, res) => {
  const stores = await Store.find()
  res.render('stores', {title: 'Stores', stores: stores} )
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id })
  res.render('editStore', {title: `Edit ${store.name}`, store: store})
}

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point'
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec()
  req.flash('success', `Successfully updated <strong>${store.name}</strong> <a href='/store/${store.slug}'> View store </a>`)
  res.redirect(`/stores/${store._id}/edit`)
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug })
  if(!store) {
    next()
    return
  }
  // Enable Google Maps Embed API service 
  // https://console.cloud.google.com/apis/api/maps-embed-backend.googleapis.com
  // https://console.cloud.google.com/apis/library/static-maps-backend.googleapis.com?q=staticmap
  res.render('store', {title: store.name, store: store})
}