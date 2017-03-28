using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace AnimalsGallery.Tests.Controllers
{
    [TestFixture]
    class AngularTests
    {
        [Test]
        public void AddAndDeleteImageSeleniumTest()
        {
            string albumName = "1";
            string imageUrl = "http://www.gettyimages.com/gi-resources/images/Embed/new/embed2.jpg";
            string imageDescription = "same new text";

            IWebDriver chromeDriver = new ChromeDriver();

            chromeDriver.Navigate().GoToUrl("http://localhost:22948/");
            chromeDriver.Manage().Timeouts().ImplicitlyWait(TimeSpan.FromSeconds(5));
            chromeDriver.Manage().Window.Maximize();

            var link = chromeDriver.FindElement(By.Id("gallery"));
            Assert.NotNull(link);
            link.Click();

            chromeDriver.Manage().Timeouts().ImplicitlyWait(TimeSpan.FromSeconds(5));

            var dropDownList = chromeDriver.FindElement(By.Id("albumsList"));
            Assert.NotNull(dropDownList);
            dropDownList.SendKeys(albumName);

            var urlTextArea = chromeDriver.FindElement(By.Id("urlArea"));
            Assert.NotNull(urlTextArea);
            urlTextArea.SendKeys(imageUrl);

            var descTextArea = chromeDriver.FindElement(By.Id("descArea"));
            Assert.NotNull(descTextArea);
            descTextArea.SendKeys(imageDescription);

            var addImageButton = chromeDriver.FindElement(By.Id("addImageButton"));
            Assert.NotNull(addImageButton);
            addImageButton.Click();

            var images = chromeDriver.FindElements(By.ClassName("image-view"));
            Assert.NotNull(images);

            var beleteButton = images.First().FindElement(By.TagName("input"));
            Assert.NotNull(beleteButton);
            beleteButton.Click();
        }
    }
}
