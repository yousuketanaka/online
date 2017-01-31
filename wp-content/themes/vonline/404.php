<?php load_template(TEMPLATEPATH . '/header-2.php'); ?>


<main>
    <div class="container">
        <div class="row">
            <div class="col-md-8">
                <h3>SORRY !</h3>
                <p>Document or file requested was not found...</p>
                <h2>404</h2>
                <div class="back-to-home">
                  <a href="<?php echo home_url(); ?>">Go Back to Home</a>
                </div>
            </div>
            <div class="col-md-4">
                <?php get_sidebar(); ?>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>