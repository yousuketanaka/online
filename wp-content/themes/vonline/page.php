<?php load_template(TEMPLATEPATH . '/header-2.php'); ?>


<main>
    <div class="container">
        <div class="row">
            <div class="col-md-8">
                <?php while(have_posts()): the_post(); ?>
                    <?php the_content(); ?>
                <?php endwhile; ?>
            </div>
            <div class="col-md-4">
                <?php get_sidebar(); ?>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>