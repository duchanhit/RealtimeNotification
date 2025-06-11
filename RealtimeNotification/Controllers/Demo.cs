using Microsoft.AspNetCore.Mvc;

namespace RealtimeNotification.Controllers
{
    public class Demo : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
