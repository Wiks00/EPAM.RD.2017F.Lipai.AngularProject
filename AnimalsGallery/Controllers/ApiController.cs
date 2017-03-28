using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using AnimalsGallery.DAL;
using AnimalsGallery.Models;

namespace AnimalsGallery.Controllers
{
    public class ApiController : Controller
    {
        private readonly GalleryEntities galleryContext = new GalleryEntities();

        [HttpGet]
        public ActionResult GetUser(string username)
        {
            var user = galleryContext.Users.FirstOrDefault(
                dalUser => dalUser.username.Equals(username, StringComparison.InvariantCultureIgnoreCase));

            if (ReferenceEquals(user, null))
                return Json(new { success = false }, JsonRequestBehavior.AllowGet); 

            return Json(new {
                                id = user.id,
                                username = user.username,
                                roles = user.Roles.Select(role => role.role).ToList(),
                                albums = user.Albums.Select(album => new { id = album.id, title = album.title }).ToList()
                            }
                    , JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult LoadImageForModeration()
        {
            return Json(galleryContext.Images.Where(image => image.allowable == false).Select(image => new{
                                                                                                            id = image.id,
                                                                                                            title = image.title,
                                                                                                            description = image.description,
                                                                                                            price = image.price,
                                                                                                            date = image.postDate,
                                                                                                            user = image.Albums.Users.username
            }).ToList() , JsonRequestBehavior.AllowGet);
        }


        [HttpGet]
        public ActionResult LoadImage(int imageId)
        {
            var image = galleryContext.Images.Find(imageId);

            return File(image.data, image.format);
        }

        [HttpGet]
        public ActionResult GetAllAlbums()
        {
            return Json(galleryContext.Albums.Select(album => new {
                id = album.id,
                title = album.title,
                rating = album.rating,
                images = album.Images.Where(image => image.allowable).Select(image => new { id = image.id,
                                                                                            title = image.title,
                                                                                            description = image.description,
                                                                                            price = image.price,
                                                                                            date = image.postDate,
                                                                                            format = image.format.Substring(image.format.IndexOf("/") + 1)
                                                                                             

                })
            }).ToList()
                    , JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult LoadPersonalImageVote(int imageId,int userId)
        {
            var image = galleryContext.Images.Find(imageId);

            return Json(image.Votes.FirstOrDefault(vote => vote.userId == userId)?.rating ?? 0,JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult UpdateImageRating(int imageId, double rating, int userId, int albumId)
        {
            if (galleryContext.Votes.Count(vote => vote.userId == userId && vote.imageId == imageId) == 0)
            {
                galleryContext.Votes.Add(new Votes
                {
                    imageId = imageId,
                    rating = rating,
                    userId = userId
                });
            }
            else
            {
                var updateVote = galleryContext.Votes.First(vote => vote.userId == userId && vote.imageId == imageId);
                updateVote.rating = rating;

                galleryContext.Entry(updateVote).State = EntityState.Modified;
            }

            var album = galleryContext.Albums.Find(albumId);

            album.rating = album.Images.Sum(image => image.Votes.Sum(vote => vote.rating))/album.Images.Count;

            galleryContext.Entry(album).State = EntityState.Modified;

            galleryContext.SaveChanges();

            return Json(new { success = true , newRating = LoadImageRating(imageId) });
        }

        [HttpPost]
        public ActionResult ModerateImage(int imageId, bool allowable)
        {
            var image = galleryContext.Images.Find(imageId);
            galleryContext.Images.Attach(image);

            if (allowable)
            {
                image.allowable = true;

                galleryContext.Entry(image).State = EntityState.Modified;
            }
            else
            {         
                galleryContext.Images.Remove(image);            
            }

            galleryContext.SaveChanges();

            return Json(new { success = true });
        }

        [HttpGet]
        public ActionResult LoadImageRating(int imageId)
        {
            var image = galleryContext.Images.Find(imageId);


            return Json(image.Votes.Sum(vote => vote.rating)/(image.Votes.Count == 0 ? 1 : image.Votes.Count) , JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult LoadAlbums(int userId)
        {
            var albums = galleryContext.Albums.Where(album => album.userId == userId).ToList();

            if (albums.Count == 0)
                return Json(new { success = false }, JsonRequestBehavior.AllowGet);

            return Json(albums.Select(album => new {
                                                        id = album.id ,
                                                        title = album.title,
                                                        rating = album.rating,
                                                        images =  album.Images.Where(image => image.allowable).Select(image => new
                                                        {
                                                            id = image.id ,
                                                            title = image.title ,
                                                            description = image.description,
                                                            price = image.price, date = image.postDate
                                                        })
                                                    }).ToList()
                    , JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult TopThreeAlbums()
        {
            if(galleryContext.Albums.Count(album => album.Images.Count(image => image.Votes.Count > 1) > 1) <= 2)
                return Json(new { success = false }, JsonRequestBehavior.AllowGet);

            var albums = galleryContext.Albums.OrderBy(album => album.rating).Take(3);
            var rndm = new Random(); 

            return Json(albums.Select(album => new {
                                                        id = album.id,
                                                        title = album.title,
                                                        rating = album.rating,
                                                        image = album.Images.ElementAt(rndm.Next(0, album.Images.Count -1)).data
                                                    }).ToList()
                    , JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult AddAlbum(string title, int userId)
        {
            galleryContext.Albums.Add(new Albums
            {
                title = title,
                userId = userId
            });

            galleryContext.SaveChanges();

            return Json(new { success = true });
        }

        [HttpPost]
        public ActionResult UploadImage(ImageModel image)
        {
            var rowImageData= image.Data.Substring(image.Data.IndexOf(',') + 1);

            byte[] imageData = Convert.FromBase64String(rowImageData);

            int startIndex = image.Data.IndexOf(':') + 1;
            int length = image.Data.IndexOf(';') - startIndex;

            galleryContext.Images.Add(new Images
            {
                title = image.Title,
                format = image.Data.Substring(startIndex, length),
                albumId = image.AlbumId,
                allowable = image.Allowable,
                data = imageData,
                description = image.Description,
                postDate =  DateTime.Now,
                price = image.Price
            });

            galleryContext.SaveChanges();

            return Json(new { success = true });
        }

        [HttpPost]
        public ActionResult CreateUser(UserModel user)
        {
            if (galleryContext.Users.Any(dalUser => dalUser.username.Equals(user.UserName, StringComparison.InvariantCultureIgnoreCase)))
                return Json(new {success = false});

            galleryContext.Users.Add(new Users
            {
                username = user.UserName,
                password = Crypto.HashPassword(user.Password),
                Roles = galleryContext.Roles.Where(dalRole => dalRole.role.Contains("user")).ToList()
            });

            galleryContext.SaveChanges();

            return Json(new {success = true});
        }

        [HttpPost]
        public ActionResult Authenticate(string username, string password)
        {
            var user = galleryContext.Users.FirstOrDefault(dalUser => dalUser.username.Equals(username, StringComparison.InvariantCultureIgnoreCase));

            return Json(Crypto.VerifyHashedPassword(user?.password ?? "", password) ? new { success = true } : new { success = false });
        }
    }
}