using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AnimalsGallery.Models
{
    public class ImageModel
    {
        public int AlbumId { get; set; }
        public string Title { get; set; }
        public double Price { get; set; }
        public bool Allowable { get; set; }
        public string Description { get; set; }
        public string Data { get; set; }
    }
}