using Microsoft.EntityFrameworkCore;

namespace MisrImageSelector.Api.Persistence;

public class ApplicationContext : DbContext
{
    public DbSet<Vote> Votes => Set<Vote>();
    
    public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
    {
    }
}